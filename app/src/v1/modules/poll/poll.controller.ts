import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import {
	transformCreatePollDto,
	transformPollListByMonthYearDto,
	transformPollListByStatusDto,
	transformCancelPollDto,
} from "./dto";
import { PollService } from "./poll.service";
import { PollStatusEnum } from "@/v1/enum/pollStatus.enum";

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

	public async getPollsByStatus(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const { buildingId, month, year, status } = request.query as {
			buildingId: string;
			month: string;
			year: string;
			status?: string | string[];
		};

		// Normalize status to array - simples
		let statusArray: string[] = [];
		if (Array.isArray(status)) {
			statusArray = status;
		} else if (status) {
			statusArray = status.includes(",") 
				? status.split(",").map(s => s.trim())
				: [status];
		}

		if (statusArray.length === 0) {
			return reply.status(httpStatus.BAD_REQUEST).send({
				success: false,
				message: "Status é obrigatório",
			});
		}

		const result = await this.pollService.getPollsByStatus({
			buildingId,
			month: Number(month),
			year: Number(year),
			status: statusArray,
		});

		return reply.status(httpStatus.OK).send(result);
	}


	public async getActivePollsStats(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		try {
			const { buildingId, month, year } = request.query as {
				buildingId: string;
				month: string | number;
				year: string | number;
			};

			if (!buildingId || !month || !year) {
				return reply.status(httpStatus.BAD_REQUEST).send({
					success: false,
					message: "buildingId, month e year são obrigatórios",
				});
			}

			const monthNum = typeof month === "string" ? Number(month) : month;
			const yearNum = typeof year === "string" ? Number(year) : year;

			if (isNaN(monthNum) || isNaN(yearNum)) {
				return reply.status(httpStatus.BAD_REQUEST).send({
					success: false,
					message: "Mês e ano devem ser números válidos",
				});
			}

			const validatedData = transformPollListByMonthYearDto({
				buildingId,
				month: monthNum,
				year: yearNum,
			});

			return reply
				.status(httpStatus.OK)
				.send(
					await this.pollService.getActivePollsStats(validatedData),
				);
		} catch (error: any) {
			if (error.issues) {
				// Zod validation error
				return reply.status(httpStatus.BAD_REQUEST).send({
					success: false,
					message: "Erro de validação nos dados fornecidos",
					errors: error.issues.map((issue: any) => ({
						field: issue.path.join("."),
						message: issue.message,
					})),
				});
			}
			throw error;
		}
	}

	public async cancelPoll(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const { id } = request.params as { id: string };

		return reply
			.status(httpStatus.OK)
			.send(
				await this.pollService.cancelPoll(
					id,
					transformCancelPollDto(request.body),
				),
			);
	}
}

