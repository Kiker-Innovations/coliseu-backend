import type { MongoClient } from "mongodb";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";
import type {
	ProjectSuggestionEntity,
	CreateProjectSuggestionEntity,
} from "../../../database/mongodb/entity/projectSuggestion.entity";
import type { CreateProjectEntity } from "../../../database/mongodb/entity/project.entity";
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

const MAX_VOTES_PER_RESIDENT = 3;

export class ProjectSuggestionService {
	private projectSuggestionRepository: ProjectSuggestionRepository;
	private projectSuggestionPollRepository: ProjectSuggestionPollRepository;
	private residentSuggestionRepository: ResidentSuggestionRepository;
	private seasonRepository: SeasonRepository;
	private projectRepository: ProjectRepository;
	private residentRepository: ResidentRepository;

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
	}

	public async rankSuggestions(
		seasonId: string,
		buildingId: string,
	): Promise<HttpResponse<ProjectSuggestionEntity[]>> {
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

		const suggestionsByApartment = new Map<
			string,
			typeof residentSuggestions
		>();
		for (const suggestion of residentSuggestions) {
			const apartmentId = suggestion.apartmentId;
			if (!suggestionsByApartment.has(apartmentId)) {
				suggestionsByApartment.set(apartmentId, []);
			}
			suggestionsByApartment.get(apartmentId)!.push(suggestion);
		}

		const uniqueSuggestionsByApartment: typeof residentSuggestions = [];
		for (const [_, suggestions] of suggestionsByApartment) {
			const seenTitles = new Set<string>();
			for (const suggestion of suggestions) {
				const normalizedTitle = suggestion.title.toLowerCase().trim();
				if (!seenTitles.has(normalizedTitle)) {
					seenTitles.add(normalizedTitle);
					uniqueSuggestionsByApartment.push(suggestion);
				}
			}
		}

		const suggestionCounts = new Map<
			string,
			{
				suggestion: (typeof residentSuggestions)[0];
				count: number;
				apartments: Set<string>;
			}
		>();
		for (const suggestion of uniqueSuggestionsByApartment) {
			const normalizedTitle = suggestion.title.toLowerCase().trim();
			if (!suggestionCounts.has(normalizedTitle)) {
				suggestionCounts.set(normalizedTitle, {
					suggestion,
					count: 1,
					apartments: new Set([suggestion.apartmentId]),
				});
			} else {
				const existing = suggestionCounts.get(normalizedTitle)!;
				if (!existing.apartments.has(suggestion.apartmentId)) {
					existing.count++;
					existing.apartments.add(suggestion.apartmentId);
				}
			}
		}

		const rankedSuggestions = Array.from(suggestionCounts.values()).sort(
			(a, b) => b.count - a.count,
		);

		const projectSuggestionsToCreate: CreateProjectSuggestionEntity[] =
			rankedSuggestions.map((item, index) => ({
				buildingId,
				seasonId,
				title: item.suggestion.title,
				description: item.suggestion.description,
				duplicateCount: item.count,
				rank: index + 1,
				status: ProjectSuggestionStatusEnum.AGUARDANDO_VOTACAO,
			}));

		const createdSuggestions =
			await this.projectSuggestionRepository.createMany(
				projectSuggestionsToCreate,
			);

		return {
			success: true,
			message: "Sugestões rankeadas com sucesso",
			data: createdSuggestions,
		};
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

		const seasonSuggestions =
			await this.projectSuggestionRepository.findBySeasonId(
				suggestion.seasonId,
			);
		const suggestionIds = seasonSuggestions.map((s) => s._id);

		const currentVotes =
			await this.projectSuggestionPollRepository.countVotesByResidentAndSuggestionIds(
				residentId,
				suggestionIds,
			);

		const existingVote =
			await this.projectSuggestionPollRepository.findByProjectSuggestionIdAndResidentId(
				dto.projectSuggestionId,
				residentId,
			);

		const votesBeingUsed = existingVote ? existingVote.voteCount : 0;
		const availableVotes =
			MAX_VOTES_PER_RESIDENT - currentVotes + votesBeingUsed;

		if (dto.voteCount > availableVotes) {
			throw httpException(
				`Você só possui ${availableVotes} voto(s) disponível(is). Já utilizou ${
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
			voteCount: dto.voteCount,
		});

		await this.projectSuggestionRepository.incrementVotes(
			dto.projectSuggestionId,
			dto.voteCount,
		);

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
			await this.projectSuggestionPollRepository.findByProjectSuggestionIdAndResidentId(
				projectSuggestionId,
				residentId,
			);

		if (!existingVote) {
			throw httpException(
				"Você não votou nesta sugestão",
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
			residentId,
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

	public async createProjectsFromTopSuggestions(
		seasonId: string,
		dto: ProjectSuggestionCreateProjectsDto,
		buildingId: string,
	): Promise<
		HttpResponse<
			{ id: string; title: string; description: string; votes: number }[]
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

		const topSuggestions =
			await this.projectSuggestionRepository.findTopByVotes(seasonId, dto.top);

		const createdProjects: {
			id: string;
			title: string;
			description: string;
			votes: number;
		}[] = [];

		for (const suggestion of topSuggestions) {
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
			};

			const project = await this.projectRepository.create(projectData);

			createdProjects.push({
				id: project._id,
				title: project.title,
				description: project.description,
				votes: project.votes,
			});
		}

		return {
			success: true,
			message: `${createdProjects.length} projeto(s) criado(s) com sucesso`,
			data: createdProjects,
		};
	}
}
