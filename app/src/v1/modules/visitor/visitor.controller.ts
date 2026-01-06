import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import { httpException } from "../../../config/error";
import { UserTypeEnum } from "../../enum/userType.enum";
import {
	transformCreateVisitorDto,
	transformVisitorListQueryDto,
	transformVisitorRecentQueryDto,
	transformUpdateVisitorDto,
} from "./dto";
import { VisitorService } from "./visitor.service";

export class VisitorController {
	private visitorService: VisitorService;

	constructor(mongoClient: MongoClient) {
		this.visitorService = new VisitorService(mongoClient);
	}

	public async createVisitor(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.CONCIERGE) {
			throw httpException(
				"Apenas porteiros podem criar visitantes",
				httpStatus.FORBIDDEN,
			);
		}

		const conciergeId = request.user.userId;
		const buildingId = request.user.buildingId;

		return reply
			.code(httpStatus.CREATED)
			.send(
				await this.visitorService.createVisitor(
					transformCreateVisitorDto(request.body),
					buildingId,
					conciergeId,
				),
			);
	}

	public async listVisitors(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.CONCIERGE) {
			throw httpException(
				"Apenas porteiros podem visualizar visitantes",
				httpStatus.FORBIDDEN,
			);
		}

		const buildingId = request.user.buildingId;
		const query = transformVisitorListQueryDto(request.query);

		return reply
			.status(httpStatus.OK)
			.send(await this.visitorService.listVisitors(query, buildingId));
	}

	public async getVisitorById(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.CONCIERGE) {
			throw httpException(
				"Apenas porteiros podem visualizar visitantes",
				httpStatus.FORBIDDEN,
			);
		}

		const { id } = request.params as { id: string };
		const buildingId = request.user.buildingId;

		return reply
			.status(httpStatus.OK)
			.send(await this.visitorService.getVisitorById(id, buildingId));
	}

	public async updateVisitor(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.CONCIERGE) {
			throw httpException(
				"Apenas porteiros podem atualizar visitantes",
				httpStatus.FORBIDDEN,
			);
		}

		const { id } = request.params as { id: string };
		const conciergeId = request.user.userId;
		const buildingId = request.user.buildingId;

		const visitorUpdateDto = transformUpdateVisitorDto(request.body);

		return reply
			.status(httpStatus.OK)
			.send(
				await this.visitorService.updateVisitor(
					id,
					visitorUpdateDto,
					buildingId,
					conciergeId,
				),
			);
	}

	public async listRecentVisitors(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.CONCIERGE) {
			throw httpException(
				"Apenas porteiros podem visualizar visitantes",
				httpStatus.FORBIDDEN,
			);
		}

		const buildingId = request.user.buildingId;
		const query = transformVisitorRecentQueryDto(request.query);

		return reply
			.status(httpStatus.OK)
			.send(await this.visitorService.listRecentVisitors(query, buildingId));
	}
}
