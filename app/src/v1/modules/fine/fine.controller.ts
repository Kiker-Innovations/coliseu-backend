import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import { httpException } from "../../../config/error";
import { FineService } from "./fine.service";
import { UserTypeEnum } from "../../enum/userType.enum";
import { transformCreateFineDto, transformUpdateFineDto } from "./dto";

export class FineController {
	private fineService: FineService;

	constructor(mongoClient: MongoClient) {
		this.fineService = new FineService(mongoClient);
	}

	public async createFine(
		request: FastifyRequest,
		reply: FastifyReply
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.ADMIN) {
			throw httpException(
				"Apenas administradores podem criar multas",
				httpStatus.FORBIDDEN
			);
		}

		const dto = transformCreateFineDto({
			...(request.body as any),
			buildingId: request.user.buildingId,
		});

		return reply
			.code(httpStatus.CREATED)
			.send(await this.fineService.createFine(dto));
	}

	public async deleteFine(
		request: FastifyRequest,
		reply: FastifyReply
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.ADMIN) {
			throw httpException(
				"Apenas administradores podem deletar multas",
				httpStatus.FORBIDDEN
			);
		}

		const { id } = request.params as { id: string };

		return reply
			.status(httpStatus.OK)
			.send(await this.fineService.deleteFine(id));
	}

	public async getFines(
		request: FastifyRequest,
		reply: FastifyReply
	): Promise<void> {
		if (
			request.user.userType !== UserTypeEnum.ADMIN &&
			request.user.userType !== UserTypeEnum.RESIDENT
		) {
			throw httpException(
				"Apenas administradores e moradores podem visualizar multas",
				httpStatus.FORBIDDEN
			);
		}

		return reply
			.status(httpStatus.OK)
			.send(
				await this.fineService.getAllFines(request.user.buildingId)
			);
	}

	public async updateFine(
		request: FastifyRequest,
		reply: FastifyReply
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.ADMIN) {
			throw httpException(
				"Apenas administradores podem editar multas",
				httpStatus.FORBIDDEN
			);
		}

		const { id } = request.params as { id: string };
		const dto = transformUpdateFineDto(request.body as any);

		return reply
			.status(httpStatus.OK)
			.send(await this.fineService.updateFine(id, dto));
	}
}
