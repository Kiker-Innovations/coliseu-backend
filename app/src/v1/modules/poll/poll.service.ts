import type { MongoClient } from "mongodb";
import type {
	CreatePollEntity,
	PollEntity,
	PollOption,
} from "../../../database/mongodb/entity/poll.entity";
import { PollRepository } from "../../../database/mongodb/repositories/poll.repository";
import { BuildingRepository } from "../../../database/mongodb/repositories/building.repository";
import { ResidentRepository } from "../../../database/mongodb/repositories/resident.repository";
import type {
	PollCreateDto,
	PollListByMonthYearDto,
} from "./dto";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";
import { PollStatusEnum, type PollStatusEnumType } from "@/v1/enum/pollStatus.enum";
import { getDate, toDate } from "@/v1/utils/utils";

interface ActivePollResponse {
	description: string;
	startDate: Date;
	endDate: Date;
	votes: number;
	options: PollOption[];
	status: string;
}

interface FinishedPollResponse {
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

	constructor(mongoClient: MongoClient) {
		this.pollRepository = new PollRepository(mongoClient);
		this.buildingRepository = new BuildingRepository(mongoClient);
		this.residentRepository = new ResidentRepository(mongoClient);
	}

	private async validateBuildingExists(buildingId: string): Promise<void> {
		const building = await this.buildingRepository.findById(buildingId);
		if (!building) {
			throw httpException(
				"Edifício não encontrado",
				httpStatus.NOT_FOUND,
			);
		}
	}

	public async createPoll(
		pollCreateDto: PollCreateDto,
	): Promise<
		HttpResponse<{
			id: string;
			description: string;
			status: string;
		}>
	> {
		// Verify building exists
		await this.validateBuildingExists(pollCreateDto.buildingId);

		// Determine status based on startDate
		const now = getDate();
		const startDate = pollCreateDto.startDate;
		const startDateOnly = toDate(startDate).startOf("day").toDate();
		const nowDateOnly = toDate(now).startOf("day").toDate();

		// If startDate is today or in the past, status is ATIVO
		// Otherwise, status is PROGRAMADO
		let finalStatus: PollStatusEnumType;
		if (startDateOnly.getTime() <= nowDateOnly.getTime()) {
			finalStatus = PollStatusEnum.ATIVO;
		} else {
			finalStatus = PollStatusEnum.PROGRAMADO;
		}

		const pollEntity: CreatePollEntity = {
			buildingId: pollCreateDto.buildingId,
			description: pollCreateDto.description,
			options: pollCreateDto.options as string[],
			status: finalStatus,
			startDate: pollCreateDto.startDate,
			endDate: pollCreateDto.endDate,
		};

		const createdPoll = await this.pollRepository.create(pollEntity);

		return {
			success: true,
			message: "Enquete cadastrada com sucesso!",
			data: {
				id: createdPoll._id,
				description: createdPoll.description,
				status: createdPoll.status,
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
				...option,
				percent: Math.round(percent * 100) / 100, // Round to 2 decimal places
			};
		});
	}

	public async getActivePolls(
		pollListDto: PollListByMonthYearDto,
	): Promise<HttpResponse<ActivePollResponse[]>> {
		// Verify building exists
		await this.validateBuildingExists(pollListDto.buildingId);

		const polls = await this.pollRepository.findActiveByMonthYear(
			pollListDto.buildingId,
			pollListDto.month,
			pollListDto.year,
		);

		if (!polls || polls.length === 0) {
			throw httpException(
				"Nenhuma enquete ativa encontrada",
				httpStatus.NOT_FOUND,
			);
		}

		const formattedPolls: ActivePollResponse[] = polls.map((poll) => ({
			description: poll.description,
			startDate: poll.startDate,
			endDate: poll.endDate,
			votes: poll.votes,
			options: this.calculateOptionsPercent(poll.options, poll.votes),
			status: poll.status,
		}));

		return {
			success: true,
			message: "Enquetes ativas encontradas com sucesso",
			data: formattedPolls,
		};
	}

	public async getFinishedAndCancelledPolls(
		pollListDto: PollListByMonthYearDto,
	): Promise<HttpResponse<FinishedPollResponse[]>> {
		// Verify building exists
		await this.validateBuildingExists(pollListDto.buildingId);

		const polls = await this.pollRepository.findFinishedAndCancelledByMonthYear(
			pollListDto.buildingId,
			pollListDto.month,
			pollListDto.year,
		);

		if (!polls || polls.length === 0) {
			throw httpException(
				"Nenhuma enquete encerrada ou cancelada encontrada",
				httpStatus.NOT_FOUND,
			);
		}

		const formattedPolls: FinishedPollResponse[] = polls.map((poll) => ({
			description: poll.description,
			startDate: poll.startDate,
			endDate: poll.endDate,
			votes: poll.votes,
			options: this.calculateOptionsPercent(poll.options, poll.votes),
			status: poll.status,
			...(poll.status === PollStatusEnum.CANCELADO && {
				cancelReason: poll.cancelReason,
				cancelledAt: poll.cancelledAt,
			}),
		}));

		return {
			success: true,
			message: "Enquetes encerradas e canceladas encontradas com sucesso",
			data: formattedPolls,
		};
	}

	public async getActivePollsStats(
		pollListDto: PollListByMonthYearDto,
	): Promise<
		HttpResponse<{
			totalPolls: number;
			totalVotes: number;
			totalPercent: number;
		}>
	> {
		// Verify building exists
		await this.validateBuildingExists(pollListDto.buildingId);

		// Get active polls for the month/year
		const polls = await this.pollRepository.findActiveByMonthYear(
			pollListDto.buildingId,
			pollListDto.month,
			pollListDto.year,
		);

		// Calculate total polls
		const totalPolls = polls.length;

		// Calculate total votes from all active polls
		const totalVotes = polls.reduce((sum, poll) => sum + poll.votes, 0);

		// Get total residents count for the building
		const totalResidents = await this.residentRepository.countByBuildingId(
			pollListDto.buildingId,
		);

		// Calculate percentage: (totalVotes / totalResidents) * 100
		const totalPercent =
			totalResidents > 0 ? (totalVotes / totalResidents) * 100 : 0;

		return {
			success: true,
			message: "Estatísticas de enquetes ativas encontradas com sucesso",
			data: {
				totalPolls,
				totalVotes,
				totalPercent: Math.round(totalPercent * 100) / 100, // Round to 2 decimal places
			},
		};
	}
}

