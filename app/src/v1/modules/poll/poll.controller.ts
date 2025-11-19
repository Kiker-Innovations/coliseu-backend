import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import {
	transformCreatePollDto,
	transformPollListByMonthYearDto,
} from "./dto";
import { PollService } from "./poll.service";

export class PollController {
	private pollService: PollService;

	constructor(mongoClient: MongoClient) {
		this.pollService = new PollService(mongoClient);
	}

	public async createPoll(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		return reply
			.code(httpStatus.CREATED)
			.send(
				await this.pollService.createPoll(
					transformCreatePollDto(request.body),
				),
			);
	}

	public async getActivePolls(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const { buildingId, month, year } = request.query as {
			buildingId: string;
			month: string;
			year: string;
		};

		return reply
			.status(httpStatus.OK)
			.send(
				await this.pollService.getActivePolls(
					transformPollListByMonthYearDto({
						buildingId,
						month: parseInt(month, 10),
						year: parseInt(year, 10),
					}),
				),
			);
	}

	public async getFinishedAndCancelledPolls(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const { buildingId, month, year } = request.query as {
			buildingId: string;
			month: string;
			year: string;
		};

		return reply
			.status(httpStatus.OK)
			.send(
				await this.pollService.getFinishedAndCancelledPolls(
					transformPollListByMonthYearDto({
						buildingId,
						month: parseInt(month, 10),
						year: parseInt(year, 10),
					}),
				),
			);
	}

	public async getActivePollsStats(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const { buildingId, month, year } = request.query as {
			buildingId: string;
			month: string;
			year: string;
		};

		return reply
			.status(httpStatus.OK)
			.send(
				await this.pollService.getActivePollsStats(
					transformPollListByMonthYearDto({
						buildingId,
						month: parseInt(month, 10),
						year: parseInt(year, 10),
					}),
				),
			);
	}
}

