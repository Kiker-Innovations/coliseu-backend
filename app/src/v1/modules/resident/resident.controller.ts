import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import {
	transformConfirmResidentDto,
	transformCreateResidentDto,
	transformUpdateResidentDto,
	transformForgetPasswordResidentDto,
	transformResetPasswordResidentDto,
} from "./dto";
import { ResidentService } from "./resident.service";

export class ResidentController {
	private residentService: ResidentService;

	constructor(mongoClient: MongoClient) {
		this.residentService = new ResidentService(mongoClient);
	}

	public async createResident(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		return reply
			.code(httpStatus.CREATED)
			.send(
				await this.residentService.createResident(
					transformCreateResidentDto(request.body),
				),
			);
	}

	public async getResident(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const { id } = request.params as { id: string };
		return reply
			.status(httpStatus.OK)
			.send(await this.residentService.getResident(id));
	}

	public async updateResident(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const { id } = request.params as { id: string };
		return reply
			.status(httpStatus.OK)
			.send(
				await this.residentService.updateResident(
					id,
					transformUpdateResidentDto(request.body),
				),
			);
	}

	public async deleteResident(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const { id } = request.params as { id: string };
		return reply
			.status(httpStatus.OK)
			.send(await this.residentService.deleteResident(id));
	}

	public async confirmResident(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		return reply
			.status(httpStatus.OK)
			.send(
				await this.residentService.confirmResidentCode(
					transformConfirmResidentDto(request.body),
				),
			);
	}

	public async forgetPassword(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		return reply
			.status(httpStatus.OK)
			.send(
				await this.residentService.forgetPassword(
					transformForgetPasswordResidentDto(request.body),
				),
			);
	}

	public async resetPassword(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		return reply
			.status(httpStatus.OK)
			.send(
				await this.residentService.resetPassword(
					transformResetPasswordResidentDto(request.body),
				),
			);
	}
}
