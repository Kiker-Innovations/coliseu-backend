import type { MongoClient } from "mongodb";
import type {
	CreatePollEntity,
	PollEntity,
	PollOption,
} from "../../../database/mongodb/entity/poll.entity";
import { PollRepository } from "../../../database/mongodb/repositories/poll.repository";
import { BuildingRepository } from "../../../database/mongodb/repositories/building.repository";
import { ResidentRepository } from "../../../database/mongodb/repositories/resident.repository";
import { PollVoteRepository } from "../../../database/mongodb/repositories/pollVote.repository";
import type {
	PollCreateDto,
	PollListByMonthYearDto,
	PollListByStatusDto,
	PollCancelDto,
} from "./dto";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";
import {
	PollStatusEnum,
	type PollStatusEnumType,
} from "@/v1/enum/pollStatus.enum";
import { getDate, toDate, calculatePollStatus } from "@/v1/utils/utils";

interface PollResponse {
	id: string;
	description: string;
	startDate: Date;
	endDate: Date;
	votes: number;
	options: PollOption[];
	status: string;
	cancelReason?: string;
	cancelledAt?: Date;
}

export class PollService {
	private pollRepository: PollRepository;
	private buildingRepository: BuildingRepository;
	private residentRepository: ResidentRepository;
	private pollVoteRepository: PollVoteRepository;

	constructor(mongoClient: MongoClient) {
		this.pollRepository = new PollRepository(mongoClient);
		this.buildingRepository = new BuildingRepository(mongoClient);
		this.residentRepository = new ResidentRepository(mongoClient);
		this.pollVoteRepository = new PollVoteRepository(mongoClient);
	}

	private async validateBuildingExists(buildingId: string): Promise<void> {
		const building = await this.buildingRepository.findById(buildingId);
		if (!building) {
			throw httpException("Edifício não encontrado", httpStatus.NOT_FOUND);
		}
	}

	public async createPoll(
		pollCreateDto: PollCreateDto,
		buildingId: string,
	): Promise<
		HttpResponse<{
			id: string;
			description: string;
			status: string;
		}>
	> {
		await this.validateBuildingExists(buildingId);
		const normalizedStartDate = pollCreateDto.startDate;
		const normalizedEndDate = pollCreateDto.endDate;

		const pollEntity: CreatePollEntity = {
			buildingId,
			description: pollCreateDto.description,
			options: pollCreateDto.options as string[],
			startDate: normalizedStartDate,
			endDate: normalizedEndDate,
		};

		const createdPoll = await this.pollRepository.create(pollEntity);

		// Calcular status baseado nas datas
		const calculatedStatus = calculatePollStatus(
			createdPoll.startDate,
			createdPoll.endDate,
			createdPoll.cancelledAt,
		);

		return {
			success: true,
			message: "Enquete cadastrada com sucesso!",
			data: {
				id: String(createdPoll._id),
				description: createdPoll.description,
				status: calculatedStatus,
			},
		};
	}

	private calculateOptionsPercent(
		options: PollOption[],
		totalVotes: number,
	): PollOption[] {
		return options.map((option) => {
			const percent = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
			return {
				id: option.id,
				description: option.description,
				votes: option.votes,
				percent: parseFloat(percent.toFixed(2)), // Round to 2 decimal places
			};
		});
	}

	public async getPollsByStatus(pollListDto: {
		buildingId: string;
		status: string[];
	}): Promise<HttpResponse<PollResponse[]>> {
		await this.validateBuildingExists(pollListDto.buildingId);

		// Buscar todas as enquetes do prédio
		const allPolls = await this.pollRepository.findMany({
			buildingId: pollListDto.buildingId,
		});

		// Filtrar por status calculado
		const polls = allPolls.filter((poll) => {
			const startDate =
				poll.startDate instanceof Date
					? poll.startDate
					: new Date(poll.startDate);
			const endDate =
				poll.endDate instanceof Date ? poll.endDate : new Date(poll.endDate);
			const cancelledAt = poll.cancelledAt
				? poll.cancelledAt instanceof Date
					? poll.cancelledAt
					: new Date(poll.cancelledAt)
				: null;
			const calculatedStatus = calculatePollStatus(
				startDate,
				endDate,
				cancelledAt,
			);
			return pollListDto.status.includes(calculatedStatus);
		});

		if (!polls || polls.length === 0) {
			return {
				success: true,
				message: "Nenhuma enquete encontrada",
				data: [],
			};
		}

		const formattedPolls = polls.map((poll) => {
			const startDate =
				poll.startDate instanceof Date
					? poll.startDate
					: new Date(poll.startDate);
			const endDate =
				poll.endDate instanceof Date ? poll.endDate : new Date(poll.endDate);
			const cancelledAt = poll.cancelledAt
				? poll.cancelledAt instanceof Date
					? poll.cancelledAt
					: new Date(poll.cancelledAt)
				: null;

			// Calcular status baseado nas datas
			const calculatedStatus = calculatePollStatus(
				startDate,
				endDate,
				cancelledAt,
			);

			const pollResponse: any = {
				id: String(poll._id),
				description: poll.description,
				startDate,
				endDate,
				votes: poll.votes,
				options: this.calculateOptionsPercent(poll.options, poll.votes),
				status: calculatedStatus,
			};

			if (cancelledAt) {
				pollResponse.cancelReason = poll.cancelReason;
				pollResponse.cancelledAt = cancelledAt;
			}

			return pollResponse;
		});

		return {
			success: true,
			message: "Enquetes encontradas com sucesso",
			data: formattedPolls,
		};
	}

	public async getActivePollsStats(buildingId: string): Promise<
		HttpResponse<{
			totalPolls: number;
			totalVotes: number;
			totalPercent: number;
		}>
	> {
		try {
			// Verify building exists
			await this.validateBuildingExists(buildingId);

			// Buscar todas as enquetes e filtrar apenas as ativas baseado nas datas
			const allPolls = await this.pollRepository.findMany({ buildingId });
			const now = getDate();
			const polls = allPolls.filter((poll) => {
				const status = calculatePollStatus(
					poll.startDate instanceof Date
						? poll.startDate
						: new Date(poll.startDate),
					poll.endDate instanceof Date ? poll.endDate : new Date(poll.endDate),
					poll.cancelledAt
						? poll.cancelledAt instanceof Date
							? poll.cancelledAt
							: new Date(poll.cancelledAt)
						: null,
				);
				return status === PollStatusEnum.ATIVO;
			});

			// Calculate total polls
			const totalPolls = polls.length;

			// Calculate total votes from all active polls
			const totalVotes = polls.reduce(
				(sum, poll) => sum + (poll.votes || 0),
				0,
			);

			// Get total active residents count for the building
			const totalActiveResidents =
				await this.residentRepository.countActiveByBuildingId(buildingId);

			// Get poll IDs from active polls
			const pollIds = polls.map((poll) => poll._id);

			// If no polls, return 0
			if (pollIds.length === 0) {
				return {
					success: true,
					message: "Estatísticas de enquetes ativas encontradas com sucesso",
					data: {
						totalPolls: 0,
						totalVotes: 0,
						totalPercent: 0,
					},
				};
			}

			// Get distinct resident IDs who voted in active polls
			const distinctResidentIds =
				await this.pollVoteRepository.getDistinctResidentIdsByPollIds(pollIds);

			// If no votes, return 0
			if (distinctResidentIds.length === 0) {
				return {
					success: true,
					message: "Estatísticas de enquetes ativas encontradas com sucesso",
					data: {
						totalPolls,
						totalVotes,
						totalPercent: 0,
					},
				};
			}

			// Get all residents at once to check status
			const residents = await Promise.all(
				distinctResidentIds.map((residentId) =>
					this.residentRepository.findById(residentId),
				),
			);

			// Filter to only active residents
			const activeResidentIds = residents
				.filter((resident) => resident && resident.status === "ATIVO")
				.map((resident) => resident!._id);

			// Calculate weighted average percentage considering:
			// - Total of active polls (totalPolls)
			// - Total of votes (totalVotes)
			// - Total of active residents (totalActiveResidents)
			// - Active residents who voted (activeResidentsWhoVoted)
			//
			// Formula: Weighted average = (participation_rate * poll_weight + vote_weight) / 2
			// Where:
			// - participation_rate = active residents who voted / total active residents
			// - poll_weight = normalized number of active polls (0 to 1)
			// - vote_weight = normalized number of votes per resident (0 to 1)
			const activeResidentsWhoVoted = activeResidentIds.length;

			// Participation rate: percentage of active residents who voted
			const participationRate =
				totalActiveResidents > 0
					? activeResidentsWhoVoted / totalActiveResidents
					: 0;

			// Poll weight: normalized by max expected polls (assume 10 as max)
			const pollWeight = Math.min(totalPolls / 10, 1);

			// Vote weight: normalized votes per active resident (assume 1 vote per resident per poll as ideal)
			const idealVotes = totalActiveResidents * totalPolls;
			const voteWeight =
				idealVotes > 0 ? Math.min(totalVotes / idealVotes, 1) : 0;

			// Weighted average: combines participation rate with poll and vote weights
			// 60% weight on participation, 20% on poll count, 20% on vote count
			const totalPercent =
				(participationRate * 0.6 + pollWeight * 0.2 + voteWeight * 0.2) * 100;

			return {
				success: true,
				message: "Estatísticas de enquetes ativas encontradas com sucesso",
				data: {
					totalPolls,
					totalVotes,
					totalPercent: parseFloat(Math.min(totalPercent, 100).toFixed(2)), // Round to 2 decimal places, cap at 100%
				},
			};
		} catch (error) {
			// Log error for debugging
			console.error("Error in getActivePollsStats:", error);
			throw error;
		}
	}

	public async cancelPoll(
		pollId: string,
		pollCancelDto: PollCancelDto,
		buildingId: string,
	): Promise<
		HttpResponse<{
			id: string;
			description: string;
			status: string;
			cancelReason: string;
			cancelledAt: Date;
		}>
	> {
		// Find poll by ID
		const poll = await this.pollRepository.findById(pollId);
		if (!poll) {
			throw httpException("Enquete não encontrada", httpStatus.NOT_FOUND);
		}

		// Check if poll belongs to the building
		if (poll.buildingId !== buildingId) {
			throw httpException(
				"Você não tem permissão para cancelar esta enquete",
				httpStatus.FORBIDDEN,
			);
		}

		// Verificar status atual baseado nas datas
		const currentStatus = calculatePollStatus(
			poll.startDate instanceof Date
				? poll.startDate
				: new Date(poll.startDate),
			poll.endDate instanceof Date ? poll.endDate : new Date(poll.endDate),
			poll.cancelledAt
				? poll.cancelledAt instanceof Date
					? poll.cancelledAt
					: new Date(poll.cancelledAt)
				: null,
		);

		// Check if poll is already cancelled
		if (currentStatus === PollStatusEnum.CANCELADO) {
			throw httpException("Enquete já está cancelada", httpStatus.BAD_REQUEST);
		}

		// Check if poll is already finished
		if (currentStatus === PollStatusEnum.FINALIZADO) {
			throw httpException(
				"Não é possível cancelar uma enquete já finalizada",
				httpStatus.BAD_REQUEST,
			);
		}

		// Update poll to cancelled status (apenas cancelledAt, não status)
		const now = getDate();
		const updatedPoll = await this.pollRepository.update(pollId, {
			cancelReason: pollCancelDto.cancelReason,
			cancelledAt: now,
			updatedAt: now,
		});

		if (!updatedPoll) {
			throw httpException(
				"Erro ao cancelar enquete",
				httpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		// Calcular status após cancelamento
		const calculatedStatus = calculatePollStatus(
			updatedPoll.startDate instanceof Date
				? updatedPoll.startDate
				: new Date(updatedPoll.startDate),
			updatedPoll.endDate instanceof Date
				? updatedPoll.endDate
				: new Date(updatedPoll.endDate),
			updatedPoll.cancelledAt
				? updatedPoll.cancelledAt instanceof Date
					? updatedPoll.cancelledAt
					: new Date(updatedPoll.cancelledAt)
				: null,
		);

		return {
			success: true,
			message: "Enquete cancelada com sucesso",
			data: {
				id: String(updatedPoll._id),
				description: updatedPoll.description,
				status: calculatedStatus,
				cancelReason: updatedPoll.cancelReason!,
				cancelledAt:
					updatedPoll.cancelledAt instanceof Date
						? updatedPoll.cancelledAt
						: new Date(updatedPoll.cancelledAt!),
			},
		};
	}
}
