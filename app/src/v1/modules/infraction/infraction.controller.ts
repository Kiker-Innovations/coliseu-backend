import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import { httpException } from "../../../config/error";
import { InfractionService } from "./infraction.service";
import { UserTypeEnum } from "../../enum/userType.enum";
import {
	transformCreateInfractionFineDto,
	transformCreateInfractionNotificationDto,
	transformInfractionAppealDto,
} from "./dto";

export class InfractionController {
	private infractionService: InfractionService;

	constructor(mongoClient: MongoClient) {
		this.infractionService = new InfractionService(mongoClient);
	}

	public async createFineInfraction(
		request: FastifyRequest,
		reply: FastifyReply
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.ADMIN) {
			throw httpException(
				"Apenas administradores podem aplicar multas",
				httpStatus.FORBIDDEN
			);
		}

		const dto = transformCreateInfractionFineDto(request.body as any);

		return reply
			.code(httpStatus.CREATED)
			.send(await this.infractionService.createFineInfraction(dto));
	}

	public async createNotificationInfraction(
		request: FastifyRequest,
		reply: FastifyReply
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.ADMIN) {
			throw httpException(
				"Apenas administradores podem aplicar notificações",
				httpStatus.FORBIDDEN
			);
		}

		const dto = transformCreateInfractionNotificationDto(request.body as any);

		return reply
			.code(httpStatus.CREATED)
			.send(await this.infractionService.createNotificationInfraction(dto));
	}

	public async getInfractions(
		request: FastifyRequest,
		reply: FastifyReply
	): Promise<void> {
		const { apartmentId, status } = request.query as {
			apartmentId?: string;
			status?: string;
		};

		const buildingId = request.user.buildingId || "";
		if (!buildingId) {
			throw httpException(
				"BuildingId não encontrado no token",
				httpStatus.BAD_REQUEST
			);
		}

		return reply
			.status(httpStatus.OK)
			.send(
				await this.infractionService.getInfractions(buildingId, apartmentId, status)
			);
	}

	public async getMyFines(
		request: FastifyRequest,
		reply: FastifyReply
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.RESIDENT) {
			throw httpException(
				"Apenas moradores podem visualizar suas próprias multas",
				httpStatus.FORBIDDEN
			);
		}

		if (!request.user.apartmentId) {
			throw httpException(
				"Morador não possui apartamento associado",
				httpStatus.BAD_REQUEST
			);
		}

		const { status } = request.query as {
			status?: string;
		};

		return reply
			.status(httpStatus.OK)
			.send(
				await this.infractionService.getMyFines(
					request.user.apartmentId,
					status
				)
			);
	}

	public async contestInfraction(
		request: FastifyRequest,
		reply: FastifyReply
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.RESIDENT) {
			throw httpException(
				"Apenas moradores podem contestar multas",
				httpStatus.FORBIDDEN
			);
		}

		if (!request.user.apartmentId || !request.user.userId) {
			throw httpException(
				"Morador não possui apartamento associado",
				httpStatus.BAD_REQUEST
			);
		}

		const dto = transformInfractionAppealDto(request.body as any);

		return reply
			.code(httpStatus.CREATED)
			.send(
				await this.infractionService.contestInfraction(
					dto,
					request.user.userId,
					request.user.apartmentId
				)
			);
	}

	public async getInfractionAppeal(
		request: FastifyRequest,
		reply: FastifyReply
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.RESIDENT) {
			throw httpException(
				"Apenas moradores podem visualizar contestações",
				httpStatus.FORBIDDEN
			);
		}

		if (!request.user.apartmentId || !request.user.userId) {
			throw httpException(
				"Morador não possui apartamento associado",
				httpStatus.BAD_REQUEST
			);
		}

		const { infractionId } = request.params as { infractionId: string };

		return reply
			.status(httpStatus.OK)
			.send(
				await this.infractionService.getInfractionAppeal(
					infractionId,
					request.user.userId,
					request.user.apartmentId
				)
			);
	}

	public async approveAppeal(
		request: FastifyRequest,
		reply: FastifyReply
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.ADMIN) {
			throw httpException(
				"Apenas administradores podem aprovar contestações",
				httpStatus.FORBIDDEN
			);
		}

		const { infractionId } = request.params as { infractionId: string };

		return reply
			.status(httpStatus.OK)
			.send(await this.infractionService.approveAppeal(infractionId));
	}

	public async rejectAppeal(
		request: FastifyRequest,
		reply: FastifyReply
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.ADMIN) {
			throw httpException(
				"Apenas administradores podem reprovar contestações",
				httpStatus.FORBIDDEN
			);
		}

		const { infractionId } = request.params as { infractionId: string };

		return reply
			.status(httpStatus.OK)
			.send(await this.infractionService.rejectAppeal(infractionId));
	}

	public async getInfractionAppealForAdmin(
		request: FastifyRequest,
		reply: FastifyReply
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.ADMIN) {
			throw httpException(
				"Apenas administradores podem visualizar contestações",
				httpStatus.FORBIDDEN
			);
		}

		const { infractionId } = request.params as { infractionId: string };

		return reply
			.status(httpStatus.OK)
			.send(await this.infractionService.getInfractionAppealForAdmin(infractionId));
	}
}

