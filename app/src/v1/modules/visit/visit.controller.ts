import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import { httpException } from "../../../config/error";
import { UserTypeEnum } from "../../enum/userType.enum";
import {
	transformCreateVisitDto,
	transformVisitListQueryDto,
	transformVisitRecentQueryDto,
} from "./dto";
import { VisitService } from "./visit.service";

export class VisitController {
	private visitService: VisitService;

	constructor(mongoClient: MongoClient) {
		this.visitService = new VisitService(mongoClient);
	}

	public async createVisit(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.CONCIERGE) {
			throw httpException(
				"Apenas porteiros podem registrar visitas",
				httpStatus.FORBIDDEN,
			);
		}

		const conciergeId = request.user.userId;
		const buildingId = request.user.buildingId;

		return reply
			.code(httpStatus.CREATED)
			.send(
				await this.visitService.createVisit(
					transformCreateVisitDto(request.body),
					buildingId,
					conciergeId,
				),
			);
	}

	public async listVisitsByVisitorId(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.CONCIERGE) {
			throw httpException(
				"Apenas porteiros podem visualizar visitas",
				httpStatus.FORBIDDEN,
			);
		}

		const { visitorId } = request.params as { visitorId: string };
		const buildingId = request.user.buildingId;
		const query = transformVisitListQueryDto(request.query);

		return reply
			.status(httpStatus.OK)
			.send(
				await this.visitService.listVisitsByVisitorId(
					visitorId,
					query,
					buildingId,
				),
			);
	}

	public async listRecentVisits(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.CONCIERGE) {
			throw httpException(
				"Apenas porteiros podem visualizar visitas",
				httpStatus.FORBIDDEN,
			);
		}

		const buildingId = request.user.buildingId;
		const query = transformVisitRecentQueryDto(request.query);

		return reply
			.status(httpStatus.OK)
			.send(
				await this.visitService.listRecentVisits(query, buildingId),
			);
	}
}

