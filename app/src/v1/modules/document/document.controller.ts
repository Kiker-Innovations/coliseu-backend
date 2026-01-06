import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import { httpException } from "../../../config/error";
import { transformCreateDocumentDto, transformUpdateDocumentDto } from "./dto";
import { DocumentService } from "./document.service";
import { UserTypeEnum } from "../../enum/userType.enum";

export class DocumentController {
	private documentService: DocumentService;

	constructor(mongoClient: MongoClient) {
		this.documentService = new DocumentService(mongoClient);
	}

	public async createDocument(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.ADMIN) {
			throw httpException(
				"Apenas administradores podem publicar documentos",
				httpStatus.FORBIDDEN,
			);
		}

		const dto = transformCreateDocumentDto({
			...(request.body as any),
			buildingId: request.user.buildingId,
		});

		return reply
			.code(httpStatus.CREATED)
			.send(await this.documentService.createDocument(dto));
	}

	public async getDocuments(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		return reply
			.status(httpStatus.OK)
			.send(
				await this.documentService.getDocumentsByBuildingId(
					request.user.buildingId,
				),
			);
	}

	public async getDocumentById(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const { id } = request.params as { id: string };
		return reply
			.status(httpStatus.OK)
			.send(await this.documentService.getDocumentById(id));
	}

	public async updateDocument(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.ADMIN) {
			throw httpException(
				"Apenas administradores podem atualizar documentos",
				httpStatus.FORBIDDEN,
			);
		}

		const { id } = request.params as { id: string };
		return reply
			.status(httpStatus.OK)
			.send(
				await this.documentService.updateDocument(
					id,
					transformUpdateDocumentDto(request.body as any),
				),
			);
	}

	public async deleteDocument(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.ADMIN) {
			throw httpException(
				"Apenas administradores podem remover documentos",
				httpStatus.FORBIDDEN,
			);
		}

		const { id } = request.params as { id: string };
		return reply
			.status(httpStatus.OK)
			.send(await this.documentService.deleteDocument(id));
	}
}
