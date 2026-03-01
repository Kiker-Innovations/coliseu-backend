import type { MongoClient } from "mongodb";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";
import type {
	ProjectSuggestionEntity,
	CreateProjectSuggestionEntity,
} from "../../../database/mongodb/entity/projectSuggestion.entity";
import type { CreateProjectEntity } from "../../../database/mongodb/entity/project.entity";
import type { ResidentSuggestionEntity } from "../../../database/mongodb/entity/residentSuggestion.entity";
import { ProjectSuggestionRepository } from "../../../database/mongodb/repositories/projectSuggestion.repository";
import { ProjectSuggestionPollRepository } from "../../../database/mongodb/repositories/projectSuggestionPoll.repository";
import { ResidentSuggestionRepository } from "../../../database/mongodb/repositories/residentSuggestion.repository";
import { SeasonRepository } from "../../../database/mongodb/repositories/season.repository";
import { ProjectRepository } from "../../../database/mongodb/repositories/project.repository";
import { ResidentRepository } from "../../../database/mongodb/repositories/resident.repository";
import type {
	ProjectSuggestionStartVotingDto,
	ProjectSuggestionVoteDto,
	ProjectSuggestionCreateProjectsDto,
} from "./dto";
import { ProjectSuggestionStatusEnum } from "../../enum/projectSuggestionStatus.enum";
import { getDate, toDate } from "@/v1/utils/utils";
import { env } from "../../../config/env";
import { HuggingFaceProvider } from "../../../providers/huggingface/huggingface.provider";
import { SQSProvider } from "../../../providers/aws/sqs.provider";
import {
	type EmbeddedItem,
	groupBySimilarity,
} from "../../utils/similarity";

const MAX_VOTES_PER_APARTMENT = 3;

/**
 * Internal type for tracking suggestions with their embeddings during AI processing.
 */
interface SuggestionWithEmbedding extends EmbeddedItem {
	suggestion: ResidentSuggestionEntity;
}

/**
 * Result of grouping similar suggestions across apartments.
 */
interface GroupedSuggestion {
	title: string;
	description: string;
	duplicateCount: number;
	apartmentIds: string[];
}

export class ProjectSuggestionService {
	private projectSuggestionRepository: ProjectSuggestionRepository;
	private projectSuggestionPollRepository: ProjectSuggestionPollRepository;
	private residentSuggestionRepository: ResidentSuggestionRepository;
	private seasonRepository: SeasonRepository;
	private projectRepository: ProjectRepository;
	private residentRepository: ResidentRepository;
	private huggingFaceProvider: HuggingFaceProvider;
	private sqsProvider: SQSProvider;

	constructor(mongoClient: MongoClient) {
		this.projectSuggestionRepository = new ProjectSuggestionRepository(
			mongoClient,
		);
		this.projectSuggestionPollRepository = new ProjectSuggestionPollRepository(
			mongoClient,
		);
		this.residentSuggestionRepository = new ResidentSuggestionRepository(
			mongoClient,
		);
		this.seasonRepository = new SeasonRepository(mongoClient);
		this.projectRepository = new ProjectRepository(mongoClient);
		this.residentRepository = new ResidentRepository(mongoClient);
		this.huggingFaceProvider = new HuggingFaceProvider();
		this.sqsProvider = new SQSProvider();
	}

	/**
	 * Starts the async ranking process for resident suggestions.
	 * Sets the season's rankingStatus to "in_progress" and returns immediately.
	 * The actual processing continues in the background.
	 */
	public async rankSuggestions(
		seasonId: string,
		buildingId: string,
	): Promise<HttpResponse<null>> {
		const season = await this.seasonRepository.findById(seasonId);

		if (!season) {
			throw httpException("Season não encontrada", httpStatus.NOT_FOUND);
		}

		if (season.buildingId !== buildingId) {
			throw httpException(
				"Você não tem permissão para rankear sugestões desta season",
				httpStatus.FORBIDDEN,
			);
		}

		if (season.rankingStatus === "in_progress") {
			throw httpException(
				"O processamento das sugestões já está em andamento",
				httpStatus.BAD_REQUEST,
			);
		}

		if (season.rankingStatus === "done") {
			throw httpException(
				"As sugestões desta season já foram rankeadas",
				httpStatus.BAD_REQUEST,
			);
		}

		const existingSuggestions =
			await this.projectSuggestionRepository.countBySeasonId(seasonId);
		if (existingSuggestions > 0) {
			throw httpException(
				"As sugestões desta season já foram rankeadas",
				httpStatus.BAD_REQUEST,
			);
		}

		const residentSuggestions =
			await this.residentSuggestionRepository.findMany({
				actualSeasonId: seasonId,
				buildingId: buildingId,
			});

		if (residentSuggestions.length === 0) {
			throw httpException(
				"Não há sugestões para rankear nesta season",
				httpStatus.BAD_REQUEST,
			);
		}

		// Set ranking status to in_progress
		await this.seasonRepository.update(seasonId, {
			rankingStatus: "in_progress",
		});

		// Fire-and-forget: process ranking in background
		this.processRankingAsync(seasonId, buildingId, residentSuggestions)
			.catch((error) => {
				console.error("[Ranking] Unhandled error in async ranking:", error);
			});

		return {
			success: true,
			message: "Processamento de sugestões iniciado. Acompanhe o status pela temporada.",
			data: null,
		};
	}

	/**
	 * Processes ranking asynchronously in the background.
	 * Updates the season's rankingStatus to "done" on success or "error" on failure.
	 */
	private async processRankingAsync(
		seasonId: string,
		buildingId: string,
		residentSuggestions: ResidentSuggestionEntity[],
	): Promise<void> {
		try {
			let groupedSuggestions: GroupedSuggestion[];

			if (this.huggingFaceProvider.isAvailable()) {
				try {
					console.log("[AI] Starting AI-powered suggestion ranking...");
					groupedSuggestions =
						await this.rankSuggestionsWithAI(residentSuggestions);
					console.log(
						`[AI] Successfully grouped ${residentSuggestions.length} suggestions into ${groupedSuggestions.length} groups`,
					);
				} catch (error) {
					const errorMessage =
						error instanceof Error ? error.message : "Unknown error";
					console.warn(
						`[AI] AI processing failed: ${errorMessage}. Falling back to basic text comparison.`,
					);
					groupedSuggestions =
						this.rankSuggestionsWithBasicComparison(residentSuggestions);
				}
			} else {
				console.log(
					"[AI] HuggingFace API key not configured. Using basic text comparison.",
				);
				groupedSuggestions =
					this.rankSuggestionsWithBasicComparison(residentSuggestions);
			}

			const rankedSuggestions = groupedSuggestions
				.sort((a, b) => b.duplicateCount - a.duplicateCount)
				.slice(0, 10);

			const projectSuggestionsToCreate: CreateProjectSuggestionEntity[] =
				rankedSuggestions.map((item, index) => ({
					buildingId,
					seasonId,
					title: item.title,
					description: item.description,
					duplicateCount: item.duplicateCount,
					rank: index + 1,
					status: ProjectSuggestionStatusEnum.AGUARDANDO_VOTACAO,
				}));

			await this.projectSuggestionRepository.createMany(
				projectSuggestionsToCreate,
			);

			// Set ranking status to done
			await this.seasonRepository.update(seasonId, {
				rankingStatus: "done",
			});

			console.log(`[Ranking] Season ${seasonId} ranking completed successfully.`);
		} catch (error) {
			console.error("[Ranking] Error during async ranking:", error);

			// Set ranking status to error
			await this.seasonRepository.update(seasonId, {
				rankingStatus: "error",
			});
		}
	}

	/**
	 * AI-powered ranking using Hugging Face embeddings and semantic similarity.
	 *
	 * ETAPA 1: Deduplicação intra-apartamento
	 * - Para cada apartmentId, identifica sugestões com títulos similares
	 * - Mantém apenas uma sugestão de cada grupo similar
	 * - Usa dedupThreshold (default: 0.70)
	 *
	 * ETAPA 2: Agrupamento entre apartamentos
	 * - Agrupa sugestões de apartamentos DIFERENTES que falam da mesma coisa
	 * - Usa similarityThreshold (default: 0.75)
	 * - Gera título/descrição canônica usando LLM
	 * - duplicateCount = número de apartamentos no grupo
	 */
	private async rankSuggestionsWithAI(
		suggestions: ResidentSuggestionEntity[],
	): Promise<GroupedSuggestion[]> {
		const dedupThreshold = env.providers.huggingface.dedupThreshold;
		const similarityThreshold = env.providers.huggingface.similarityThreshold;

		console.log(
			`[AI] Processando ${suggestions.length} sugestões com dedupThreshold=${dedupThreshold}, similarityThreshold=${similarityThreshold}`,
		);

		// ===== ETAPA 1: Deduplicação intra-apartamento =====
		// Gerar embeddings para todos os títulos
		const texts = suggestions.map((s) => s.title.trim());
		const { embeddings } = await this.huggingFaceProvider.generateEmbeddings(
			texts,
		);

		// Criar itens com embeddings
		const embeddedSuggestions: SuggestionWithEmbedding[] = suggestions.map(
			(suggestion, index) => ({
				id: suggestion._id,
				text: texts[index],
				embedding: embeddings[index],
				metadata: { apartmentId: suggestion.apartmentId },
				suggestion,
			}),
		);

		// Agrupar sugestões por apartmentId
		const byApartment = new Map<string, SuggestionWithEmbedding[]>();
		for (const item of embeddedSuggestions) {
			const apartmentId = item.suggestion.apartmentId;
			const existing = byApartment.get(apartmentId);
			if (existing) {
				existing.push(item);
			} else {
				byApartment.set(apartmentId, [item]);
			}
		}

		// Para cada apartamento, remover duplicatas usando similaridade semântica
		// Quando encontrar duplicatas, combinar as descrições usando IA
		const uniqueByApartment: SuggestionWithEmbedding[] = [];
		for (const [apartmentId, apartmentSuggestions] of byApartment) {
			// Agrupar sugestões similares primeiro
			const similarityGroups = groupBySimilarity(
				apartmentSuggestions,
				dedupThreshold,
			);

			// Para cada grupo de similares, manter apenas uma e unificar descrições
			for (const group of similarityGroups) {
				if (group.length === 0) {
					continue;
				}

				// Manter a primeira sugestão do grupo
				const representative = group[0];

				// Se há múltiplas sugestões no grupo, unificar todas as descrições
				if (group.length > 1) {
					const allDescriptions = group
						.map((item) => item.suggestion.description)
						.filter((desc) => desc.trim().length > 0);

					if (allDescriptions.length > 1) {
						console.log(
							`[AI] Etapa 1: Encontrado grupo de ${group.length} sugestões similares no apartamento ${apartmentId}. Unificando ${allDescriptions.length} descrições...`,
						);

						try {
							const unifiedDescription =
								await this.huggingFaceProvider.combineDescriptions(
									allDescriptions,
									representative.suggestion.title,
								);

							// Atualizar a descrição da sugestão representativa
							representative.suggestion.description = unifiedDescription;
							console.log(
								`[AI] Etapa 1: ${allDescriptions.length} descrições unificadas com sucesso para "${representative.text}"`,
							);
						} catch (error) {
							const errorMessage =
								error instanceof Error ? error.message : "Unknown error";
							console.error(
								`[AI] Etapa 1: Erro ao unificar descrições: ${errorMessage}`,
							);
							throw error; // Re-throw para que o erro seja capturado no nível superior
						}
					}
				}

				uniqueByApartment.push(representative);
			}
		}

		console.log(
			`[AI] Etapa 1 concluída: ${suggestions.length} -> ${uniqueByApartment.length} sugestões únicas`,
		);

		// ===== ETAPA 2: Agrupamento entre apartamentos =====
		// Agrupar sugestões de apartamentos DIFERENTES que falam da mesma coisa
		const groups = groupBySimilarity(uniqueByApartment, similarityThreshold);

		console.log(
			`[AI] Etapa 2: ${uniqueByApartment.length} sugestões agrupadas em ${groups.length} grupos`,
		);

		// Para cada grupo, gerar título/descrição canônica
		const groupedSuggestions: GroupedSuggestion[] = [];

		for (const group of groups) {
			// Coletar apartmentIds únicos no grupo
			const apartmentIds = [
				...new Set(group.map((item) => item.suggestion.apartmentId)),
			];

			// Preparar input para geração de texto canônico
			const suggestionInputs = group.map((item) => ({
				title: item.suggestion.title,
				description: item.suggestion.description,
			}));

			// Gerar título/descrição canônica usando LLM
			let title: string;
			let description: string;

			try {
				const canonicalResult =
					await this.huggingFaceProvider.generateCanonicalText(suggestionInputs);
				title = canonicalResult.title;
				description = canonicalResult.description;

				// Se há múltiplas sugestões mas a descrição retornada é igual à primeira,
				// significa que o LLM não combinou corretamente - forçar combinação
				if (
					group.length > 1 &&
					description === suggestionInputs[0].description &&
					suggestionInputs.some((s) => s.description !== suggestionInputs[0].description)
				) {
					console.log(
						`[AI] Etapa 2: LLM retornou descrição não unificada. Forçando unificação de ${group.length} descrições...`,
					);
					const allDescriptions = suggestionInputs
						.map((s) => s.description)
						.filter((desc) => desc.trim().length > 0);
					description =
						await this.huggingFaceProvider.combineDescriptions(
							allDescriptions,
							title,
						);
				}
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Unknown error";
				console.error(
					`[AI] Etapa 2: Erro ao gerar texto canônico: ${errorMessage}. Usando primeira sugestão como fallback.`,
				);
				// Fallback: usar primeira sugestão
				title = suggestionInputs[0].title;
				description = suggestionInputs[0].description;
			}

			console.log(
				`[AI] Grupo: "${title}" - ${apartmentIds.length} apartamento(s), ${group.length} sugestão(ões)`,
			);

			groupedSuggestions.push({
				title,
				description,
				duplicateCount: apartmentIds.length,
				apartmentIds,
			});
		}

		return groupedSuggestions;
	}

	/**
	 * Fallback ranking using basic text comparison (exact match after normalization).
	 * This is the original algorithm, preserved for cases when AI is unavailable.
	 */
	private rankSuggestionsWithBasicComparison(
		suggestions: ResidentSuggestionEntity[],
	): GroupedSuggestion[] {
		// Group suggestions by apartment
		const suggestionsByApartment = new Map<
			string,
			ResidentSuggestionEntity[]
		>();
		for (const suggestion of suggestions) {
			const apartmentId = suggestion.apartmentId;
			const existing = suggestionsByApartment.get(apartmentId);
			if (existing) {
				existing.push(suggestion);
			} else {
				suggestionsByApartment.set(apartmentId, [suggestion]);
			}
		}

		// Deduplicate within each apartment using exact title match
		const uniqueSuggestionsByApartment: ResidentSuggestionEntity[] = [];
		for (const [_, apartmentSuggestions] of suggestionsByApartment) {
			const seenTitles = new Set<string>();
			for (const suggestion of apartmentSuggestions) {
				const normalizedTitle = suggestion.title.toLowerCase().trim();
				if (!seenTitles.has(normalizedTitle)) {
					seenTitles.add(normalizedTitle);
					uniqueSuggestionsByApartment.push(suggestion);
				}
			}
		}

		// Group across apartments by exact title match
		const suggestionCounts = new Map<
			string,
			{
				suggestion: ResidentSuggestionEntity;
				count: number;
				apartments: Set<string>;
			}
		>();
		for (const suggestion of uniqueSuggestionsByApartment) {
			const normalizedTitle = suggestion.title.toLowerCase().trim();
			const existing = suggestionCounts.get(normalizedTitle);
			if (existing) {
				if (!existing.apartments.has(suggestion.apartmentId)) {
					existing.count++;
					existing.apartments.add(suggestion.apartmentId);
				}
			} else {
				suggestionCounts.set(normalizedTitle, {
					suggestion,
					count: 1,
					apartments: new Set([suggestion.apartmentId]),
				});
			}
		}

		// Convert to GroupedSuggestion format
		return Array.from(suggestionCounts.values()).map((item) => ({
			title: item.suggestion.title,
			description: item.suggestion.description,
			duplicateCount: item.count,
			apartmentIds: Array.from(item.apartments),
		}));
	}

	public async getBySeasonId(
		seasonId: string,
		buildingId: string,
	): Promise<HttpResponse<ProjectSuggestionEntity[]>> {
		const season = await this.seasonRepository.findById(seasonId);

		if (!season) {
			throw httpException("Season não encontrada", httpStatus.NOT_FOUND);
		}

		if (season.buildingId !== buildingId) {
			throw httpException(
				"Você não tem permissão para visualizar sugestões desta season",
				httpStatus.FORBIDDEN,
			);
		}

		const suggestions =
			await this.projectSuggestionRepository.findBySeasonId(seasonId);

		return {
			success: true,
			message: "Sugestões encontradas com sucesso",
			data: suggestions,
		};
	}

	public async startVoting(
		seasonId: string,
		dto: ProjectSuggestionStartVotingDto,
		buildingId: string,
	): Promise<HttpResponse<ProjectSuggestionEntity[]>> {
		const season = await this.seasonRepository.findById(seasonId);

		if (!season) {
			throw httpException("Season não encontrada", httpStatus.NOT_FOUND);
		}

		if (season.buildingId !== buildingId) {
			throw httpException(
				"Você não tem permissão para iniciar votação desta season",
				httpStatus.FORBIDDEN,
			);
		}

		const suggestions =
			await this.projectSuggestionRepository.findBySeasonId(seasonId);

		if (suggestions.length === 0) {
			throw httpException(
				"Não há sugestões rankeadas para iniciar votação",
				httpStatus.BAD_REQUEST,
			);
		}

		const hasVotingStarted = suggestions.some(
			(s) => s.status !== ProjectSuggestionStatusEnum.AGUARDANDO_VOTACAO,
		);

		if (hasVotingStarted) {
			throw httpException(
				"A votação desta season já foi iniciada",
				httpStatus.BAD_REQUEST,
			);
		}

		const votingStartDate = toDate(dto.votingStartDate).toDate();
		const votingEndDate = toDate(dto.votingEndDate).toDate();

		if (votingEndDate <= votingStartDate) {
			throw httpException(
				"A data de fim da votação deve ser posterior à data de início",
				httpStatus.BAD_REQUEST,
			);
		}

		await this.projectSuggestionRepository.updateManyBySeasonId(seasonId, {
			votingStartDate,
			votingEndDate,
			status: ProjectSuggestionStatusEnum.EM_VOTACAO,
		});

		const updatedSuggestions =
			await this.projectSuggestionRepository.findBySeasonId(seasonId);

		return {
			success: true,
			message: "Votação iniciada com sucesso",
			data: updatedSuggestions,
		};
	}

	public async endVoting(
		seasonId: string,
		buildingId: string,
	): Promise<HttpResponse<ProjectSuggestionEntity[]>> {
		const season = await this.seasonRepository.findById(seasonId);

		if (!season) {
			throw httpException("Season não encontrada", httpStatus.NOT_FOUND);
		}

		if (season.buildingId !== buildingId) {
			throw httpException(
				"Você não tem permissão para encerrar votação desta season",
				httpStatus.FORBIDDEN,
			);
		}

		const suggestions =
			await this.projectSuggestionRepository.findBySeasonIdAndStatus(
				seasonId,
				ProjectSuggestionStatusEnum.EM_VOTACAO,
			);

		if (suggestions.length === 0) {
			throw httpException(
				"Não há votação em andamento para esta season",
				httpStatus.BAD_REQUEST,
			);
		}

		await this.projectSuggestionRepository.updateManyBySeasonId(seasonId, {
			status: ProjectSuggestionStatusEnum.VOTACAO_ENCERRADA,
		});

		const updatedSuggestions =
			await this.projectSuggestionRepository.findBySeasonId(seasonId);

		const sortedByVotes = [...updatedSuggestions].sort(
			(a, b) => b.votes - a.votes,
		);
		for (let i = 0; i < sortedByVotes.length; i++) {
			await this.projectSuggestionRepository.update(sortedByVotes[i]._id, {
				rank: i + 1,
			});
		}

		const finalSuggestions =
			await this.projectSuggestionRepository.findBySeasonId(seasonId);

		return {
			success: true,
			message: "Votação encerrada com sucesso",
			data: finalSuggestions.sort((a, b) => a.rank - b.rank),
		};
	}

	public async vote(
		dto: ProjectSuggestionVoteDto,
		residentId: string,
	): Promise<
		HttpResponse<{ id: string; projectSuggestionId: string; voteCount: number }>
	> {
		const resident = await this.residentRepository.findById(residentId);

		if (!resident) {
			throw httpException("Morador não encontrado", httpStatus.NOT_FOUND);
		}

		const suggestion = await this.projectSuggestionRepository.findById(
			dto.projectSuggestionId,
		);

		if (!suggestion) {
			throw httpException("Sugestão não encontrada", httpStatus.NOT_FOUND);
		}

		if (suggestion.buildingId !== resident.buildingId) {
			throw httpException(
				"Você não pode votar em sugestões de outro prédio",
				httpStatus.FORBIDDEN,
			);
		}

		if (suggestion.status !== ProjectSuggestionStatusEnum.EM_VOTACAO) {
			throw httpException(
				"Esta sugestão não está em período de votação",
				httpStatus.BAD_REQUEST,
			);
		}

		const now = getDate();
		if (suggestion.votingStartDate && now < suggestion.votingStartDate) {
			throw httpException(
				"O período de votação ainda não começou",
				httpStatus.BAD_REQUEST,
			);
		}

		if (suggestion.votingEndDate && now > suggestion.votingEndDate) {
			throw httpException(
				"O período de votação já encerrou",
				httpStatus.BAD_REQUEST,
			);
		}

		const apartmentId = resident.apartmentId;

		const seasonSuggestions =
			await this.projectSuggestionRepository.findBySeasonId(
				suggestion.seasonId,
			);
		const suggestionIds = seasonSuggestions.map((s) => s._id);

		const currentVotes =
			await this.projectSuggestionPollRepository.countVotesByApartmentAndSuggestionIds(
				apartmentId,
				suggestionIds,
			);

		const existingVote =
			await this.projectSuggestionPollRepository.findByProjectSuggestionIdAndApartmentId(
				dto.projectSuggestionId,
				apartmentId,
			);

		const votesBeingUsed = existingVote ? existingVote.voteCount : 0;
		const availableVotes =
			MAX_VOTES_PER_APARTMENT - currentVotes + votesBeingUsed;

		if (dto.voteCount > availableVotes) {
			throw httpException(
				`Seu apartamento só possui ${availableVotes} voto(s) disponível(is). Já utilizou ${
					currentVotes - votesBeingUsed
				} voto(s) nesta season`,
				httpStatus.BAD_REQUEST,
			);
		}

		if (existingVote) {
			const voteDiff = dto.voteCount - existingVote.voteCount;

			await this.projectSuggestionPollRepository.update(existingVote._id, {
				voteCount: dto.voteCount,
			});

			if (voteDiff > 0) {
				await this.projectSuggestionRepository.incrementVotes(
					dto.projectSuggestionId,
					voteDiff,
				);
			} else if (voteDiff < 0) {
				await this.projectSuggestionRepository.decrementVotes(
					dto.projectSuggestionId,
					Math.abs(voteDiff),
				);
			}

			this.sendProjectSuggestionPollToQueueAsync(
				{
					_id: existingVote._id,
					projectSuggestionId: existingVote.projectSuggestionId,
					residentId: existingVote.residentId,
					apartmentId: existingVote.apartmentId,
					voteCount: dto.voteCount,
				},
				suggestion,
				"PROJECT_SUGGESTION_POLL_UPDATED",
				existingVote.voteCount,
			);

			return {
				success: true,
				message: "Voto atualizado com sucesso",
				data: {
					id: existingVote._id,
					projectSuggestionId: dto.projectSuggestionId,
					voteCount: dto.voteCount,
				},
			};
		}

		const vote = await this.projectSuggestionPollRepository.create({
			projectSuggestionId: dto.projectSuggestionId,
			residentId,
			apartmentId,
			voteCount: dto.voteCount,
		});

		await this.projectSuggestionRepository.incrementVotes(
			dto.projectSuggestionId,
			dto.voteCount,
		);

		this.sendProjectSuggestionPollToQueueAsync(vote, suggestion);

		return {
			success: true,
			message: "Voto registrado com sucesso",
			data: {
				id: vote._id,
				projectSuggestionId: vote.projectSuggestionId,
				voteCount: vote.voteCount,
			},
		};
	}

	public async deleteVote(
		projectSuggestionId: string,
		residentId: string,
	): Promise<HttpResponse<null>> {
		const resident = await this.residentRepository.findById(residentId);

		if (!resident) {
			throw httpException("Morador não encontrado", httpStatus.NOT_FOUND);
		}

		const suggestion =
			await this.projectSuggestionRepository.findById(projectSuggestionId);

		if (!suggestion) {
			throw httpException("Sugestão não encontrada", httpStatus.NOT_FOUND);
		}

		if (suggestion.status !== ProjectSuggestionStatusEnum.EM_VOTACAO) {
			throw httpException(
				"Esta sugestão não está em período de votação",
				httpStatus.BAD_REQUEST,
			);
		}

		const now = getDate();
		if (suggestion.votingEndDate && now > suggestion.votingEndDate) {
			throw httpException(
				"O período de votação já encerrou",
				httpStatus.BAD_REQUEST,
			);
		}

		const existingVote =
			await this.projectSuggestionPollRepository.findByProjectSuggestionIdAndApartmentId(
				projectSuggestionId,
				resident.apartmentId,
			);

		if (!existingVote) {
			throw httpException(
				"Seu apartamento não votou nesta sugestão",
				httpStatus.NOT_FOUND,
			);
		}

		await this.projectSuggestionPollRepository.delete(existingVote._id);
		await this.projectSuggestionRepository.decrementVotes(
			projectSuggestionId,
			existingVote.voteCount,
		);

		return {
			success: true,
			message: "Voto removido com sucesso",
			data: null,
		};
	}

	public async getMyVotes(
		seasonId: string,
		residentId: string,
	): Promise<
		HttpResponse<{ projectSuggestionId: string; voteCount: number }[]>
	> {
		const resident = await this.residentRepository.findById(residentId);

		if (!resident) {
			throw httpException("Morador não encontrado", httpStatus.NOT_FOUND);
		}

		const season = await this.seasonRepository.findById(seasonId);

		if (!season) {
			throw httpException("Season não encontrada", httpStatus.NOT_FOUND);
		}

		if (season.buildingId !== resident.buildingId) {
			throw httpException(
				"Você não tem permissão para visualizar votos desta season",
				httpStatus.FORBIDDEN,
			);
		}

		const suggestions =
			await this.projectSuggestionRepository.findBySeasonId(seasonId);
		const suggestionIds = suggestions.map((s) => s._id);

		const votes = await this.projectSuggestionPollRepository.findMany({
			apartmentId: resident.apartmentId,
		});

		const seasonVotes = votes.filter((v) =>
			suggestionIds.includes(v.projectSuggestionId),
		);

		return {
			success: true,
			message: "Votos encontrados com sucesso",
			data: seasonVotes.map((v) => ({
				projectSuggestionId: v.projectSuggestionId,
				voteCount: v.voteCount,
			})),
		};
	}

	public async createProjectsFromSuggestions(
		seasonId: string,
		dto: ProjectSuggestionCreateProjectsDto,
		buildingId: string,
	): Promise<
		HttpResponse<
			{ id: string; title: string; description: string; votes: number; rank: number }[]
		>
	> {
		const season = await this.seasonRepository.findById(seasonId);

		if (!season) {
			throw httpException("Season não encontrada", httpStatus.NOT_FOUND);
		}

		if (season.buildingId !== buildingId) {
			throw httpException(
				"Você não tem permissão para criar projetos desta season",
				httpStatus.FORBIDDEN,
			);
		}

		const suggestions =
			await this.projectSuggestionRepository.findBySeasonIdAndStatus(
				seasonId,
				ProjectSuggestionStatusEnum.VOTACAO_ENCERRADA,
			);

		if (suggestions.length === 0) {
			throw httpException(
				"Não há sugestões com votação encerrada para criar projetos",
				httpStatus.BAD_REQUEST,
			);
		}

		const selectedSuggestions = suggestions.filter((s) =>
			dto.suggestionIds.includes(s._id),
		);

		if (selectedSuggestions.length === 0) {
			throw httpException(
				"Nenhuma das sugestões selecionadas foi encontrada com votação encerrada",
				httpStatus.BAD_REQUEST,
			);
		}

		const createdProjects: {
			id: string;
			title: string;
			description: string;
			votes: number;
			rank: number;
		}[] = [];

		for (const suggestion of selectedSuggestions) {
			const existingProject = await this.projectRepository.findOne({
				buildingId,
				fromSeasonId: seasonId,
				title: suggestion.title,
			});

			if (existingProject) {
				continue;
			}

			const projectData: CreateProjectEntity = {
				buildingId,
				fromSeasonId: seasonId,
				title: suggestion.title,
				description: suggestion.description,
				votes: suggestion.votes,
				rank: suggestion.rank,
			};

			const project = await this.projectRepository.create(projectData);

			createdProjects.push({
				id: project._id,
				title: project.title,
				description: project.description,
				votes: project.votes,
				rank: project.rank ?? suggestion.rank,
			});
		}

		return {
			success: true,
			message: `${createdProjects.length} projeto(s) criado(s) com sucesso`,
			data: createdProjects,
		};
	}

	private sendProjectSuggestionPollToQueueAsync(
		vote: {
			_id: string;
			projectSuggestionId: string;
			residentId: string;
			apartmentId: string;
			voteCount: number;
		},
		suggestion: { buildingId: string; seasonId: string },
		action: "PROJECT_SUGGESTION_POLL_CREATED" | "PROJECT_SUGGESTION_POLL_UPDATED" = "PROJECT_SUGGESTION_POLL_CREATED",
		previousVoteCount?: number,
	): void {
		const timestamp = new Date().toISOString();
		const messageBody = JSON.stringify({
			action,
			projectSuggestionPollId: vote._id,
			projectSuggestionId: vote.projectSuggestionId,
			residentId: vote.residentId,
			apartmentId: vote.apartmentId,
			voteCount: vote.voteCount,
			...(previousVoteCount !== undefined && {
				previousVoteCount,
			}),
			buildingId: suggestion.buildingId,
			seasonId: suggestion.seasonId,
			type: "PROJECT_SUGGESTION_POLL",
			timestamp,
		});

		this.sqsProvider
			.sendMessage({
				queueUrl: env.providers.aws.sqs.voteQueueUrl,
				messageBody,
				messageGroupId: vote.projectSuggestionId,
				messageDeduplicationId: `${action}-${vote._id}-${Date.now()}`,
			})
			.then((result) => {
				if (result.success) {
					console.log(
						`[SQS] ProjectSuggestionPoll enviado com sucesso. MessageId: ${result.messageId}`,
					);
				} else {
					console.error(
						`[SQS] Falha ao enviar ProjectSuggestionPoll: ${result.error}`,
					);
				}
			})
			.catch((error) => {
				console.error(
					"[SQS] Erro ao enviar ProjectSuggestionPoll para fila SQS:",
					error,
				);
			});
	}
}
