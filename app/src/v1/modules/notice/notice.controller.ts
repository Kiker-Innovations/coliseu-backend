import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import { httpException } from "../../../config/error";
import { NoticeService } from "./notice.service";
import { UserTypeEnum } from "../../enum/userType.enum";
import {
	NoticeStatusEnum,
	type NoticeStatusEnumType,
} from "../../enum/noticeStatus.enum";
import { transformCreateNoticeDto } from "./dto";

export class NoticeController {
	private noticeService: NoticeService;

	constructor(mongoClient: MongoClient) {
		this.noticeService = new NoticeService(mongoClient);
	}

	public async createNotice(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.ADMIN) {
			throw httpException(
				"Apenas administradores podem criar avisos",
				httpStatus.FORBIDDEN,
			);
		}

		const dto = transformCreateNoticeDto({
			...(request.body as any),
			buildingId: request.user.buildingId,
		});

		return reply
			.code(httpStatus.CREATED)
			.send(await this.noticeService.createNotice(dto));
	}

	public async getNotices(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (
			request.user.userType !== UserTypeEnum.ADMIN &&
			request.user.userType !== UserTypeEnum.RESIDENT
		) {
			throw httpException(
				"Apenas administradores e moradores podem visualizar avisos",
				httpStatus.FORBIDDEN,
			);
		}

		const { status, page, limit } = request.query as {
			status?: string;
			page?: string;
			limit?: string;
		};

		let statusEnum: NoticeStatusEnumType | undefined;
		if (status) {
			if (
				status === NoticeStatusEnum.ATIVO ||
				status === NoticeStatusEnum.INATIVO
			) {
				statusEnum = status as NoticeStatusEnumType;
			} else {
				throw httpException(
					"Status inválido. Use ATIVO ou INATIVO",
					httpStatus.BAD_REQUEST,
				);
			}
		}

		const pageNumber = page ? parseInt(page, 10) : undefined;
		const limitNumber = limit ? parseInt(limit, 10) : undefined;

		return reply
			.status(httpStatus.OK)
			.send(
				await this.noticeService.getNoticesByBuildingId(
					request.user.buildingId,
					statusEnum,
					pageNumber,
					limitNumber,
				),
			);
	}

	public async getNoticeById(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (
			request.user.userType !== UserTypeEnum.ADMIN &&
			request.user.userType !== UserTypeEnum.RESIDENT
		) {
			throw httpException(
				"Apenas administradores e moradores podem visualizar avisos",
				httpStatus.FORBIDDEN,
			);
		}

		const { id } = request.params as { id: string };
		return reply
			.status(httpStatus.OK)
			.send(await this.noticeService.getNoticeById(id));
	}

	public async deleteNotice(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.ADMIN) {
			throw httpException(
				"Apenas administradores podem deletar avisos",
				httpStatus.FORBIDDEN,
			);
		}

		const { id } = request.params as { id: string };
		const { deletedNote } = request.body as { deletedNote?: string };

		if (!deletedNote || deletedNote.trim().length < 3) {
			throw httpException(
				"Motivo da deleção é obrigatório e deve ter no mínimo 3 caracteres",
				httpStatus.BAD_REQUEST,
			);
		}

		return reply
			.status(httpStatus.OK)
			.send(
				await this.noticeService.deleteNotice(
					id,
					deletedNote,
					request.user.buildingId,
				),
			);
	}
}
