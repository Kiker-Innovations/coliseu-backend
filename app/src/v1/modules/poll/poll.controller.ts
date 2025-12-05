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
import { httpException } from "@/config/error";
import { UserTypeEnum } from "@/v1/enum/userType.enum";

export class PollController {
	private pollService: PollService;

	constructor(mongoClient: MongoClient) {
		this.pollService = new PollService(mongoClient);
	}

	public async createPoll(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.ADMIN) {
            throw httpException(
                "Apenas administradores podem criar enquetes",
                httpStatus.FORBIDDEN,
            );
        }

		const buildingId = request.user.buildingId;
		
		return reply
			.code(httpStatus.CREATED)
			.send(
				await this.pollService.createPoll(
					transformCreatePollDto(request.body),
					buildingId,
				),
			);
	}

	public async getPollsByStatus(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.ADMIN) {
            throw httpException(
                "Apenas administradores podem visualizar enquetes",
                httpStatus.FORBIDDEN,
            );
        }

		const buildingId = request.user.buildingId;
		const { month, year, status } = request.query as {
			month: string;
			year: string;
			status?: string | string[];
		};

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
		if (request.user.userType !== UserTypeEnum.ADMIN) {
            throw httpException(
                "Apenas administradores podem visualizar estatísticas de enquetes",
                httpStatus.FORBIDDEN,
            );
        }

		try {
			const buildingId = request.user.buildingId;
			const { month, year } = request.query as {
				month: string | number;
				year: string | number;
			};

			if (!month || !year) {
				return reply.status(httpStatus.BAD_REQUEST).send({
					success: false,
					message: "month e year são obrigatórios",
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
				month: monthNum,
				year: yearNum,
			});

			return reply
				.status(httpStatus.OK)
				.send(
					await this.pollService.getActivePollsStats(validatedData, buildingId),
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
		if (request.user.userType !== UserTypeEnum.ADMIN) {
            throw httpException(
                "Apenas administradores podem cancelar enquetes",
                httpStatus.FORBIDDEN,
            );
        }

		const { id } = request.params as { id: string };
		const buildingId = request.user.buildingId;

		return reply
			.status(httpStatus.OK)
			.send(
				await this.pollService.cancelPoll(
					id,
					transformCancelPollDto(request.body),
					buildingId,
				),
			);
	}
}

