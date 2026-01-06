import type { MongoClient } from "mongodb";
import type {
	CreateVisitEntity,
	VisitEntity,
} from "../../../database/mongodb/entity/visit.entity";
import {
	VisitRepository,
	type VisitListResult,
	type RecentVisitItem,
} from "../../../database/mongodb/repositories/visit.repository";
import { VisitorRepository } from "../../../database/mongodb/repositories/visitor.repository";
import { ApartmentRepository } from "../../../database/mongodb/repositories/apartment.repository";
import { ConciergeRepository } from "../../../database/mongodb/repositories/concierge.repository";
import type {
	VisitCreateDto,
	VisitListQueryDto,
	VisitRecentQueryDto,
} from "./dto";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";
import { getDate } from "@/v1/utils/utils";

export class VisitService {
	private visitRepository: VisitRepository;
	private visitorRepository: VisitorRepository;
	private apartmentRepository: ApartmentRepository;
	private conciergeRepository: ConciergeRepository;

	constructor(mongoClient: MongoClient) {
		this.visitRepository = new VisitRepository(mongoClient);
		this.visitorRepository = new VisitorRepository(mongoClient);
		this.apartmentRepository = new ApartmentRepository(mongoClient);
		this.conciergeRepository = new ConciergeRepository(mongoClient);
	}

	public async createVisit(
		visitCreateDto: VisitCreateDto,
		buildingId: string,
		conciergeId: string,
	): Promise<HttpResponse<VisitEntity>> {
		// Validate visitor exists and belongs to the building
		const visitor = await this.visitorRepository.findById(
			visitCreateDto.visitorId,
		);
		if (!visitor) {
			throw httpException("Visitante não encontrado", httpStatus.NOT_FOUND);
		}
		if (visitor.buildingId !== buildingId) {
			throw httpException(
				"O visitante não pertence ao mesmo edifício",
				httpStatus.FORBIDDEN,
			);
		}

		// Validate apartment if provided
		if (visitCreateDto.apartmentId) {
			const apartment = await this.apartmentRepository.findById(
				visitCreateDto.apartmentId,
			);
			if (!apartment) {
				throw httpException("Apartamento não encontrado", httpStatus.NOT_FOUND);
			}
			if (apartment.buildingId !== buildingId) {
				throw httpException(
					"O apartamento não pertence ao mesmo edifício",
					httpStatus.FORBIDDEN,
				);
			}
		}

		// Get concierge name
		const concierge = await this.conciergeRepository.findById(conciergeId);
		if (!concierge) {
			throw httpException("Porteiro não encontrado", httpStatus.NOT_FOUND);
		}

		// Create visit entity
		const visitEntity: CreateVisitEntity = {
			visitorId: visitCreateDto.visitorId,
			apartmentId: visitCreateDto.apartmentId,
			note: visitCreateDto.note,
			registeredBy: concierge.name,
			registeredAt: getDate(),
			buildingId,
		};

		const createdVisit = await this.visitRepository.create(visitEntity);

		return {
			success: true,
			message: "Visita registrada com sucesso",
			data: createdVisit,
		};
	}

	public async listVisitsByVisitorId(
		visitorId: string,
		query: VisitListQueryDto,
		buildingId: string,
	): Promise<HttpResponse<VisitListResult>> {
		// Validate visitor exists and belongs to the building
		const visitor = await this.visitorRepository.findById(visitorId);
		if (!visitor) {
			throw httpException("Visitante não encontrado", httpStatus.NOT_FOUND);
		}
		if (visitor.buildingId !== buildingId) {
			throw httpException(
				"O visitante não pertence ao mesmo edifício",
				httpStatus.FORBIDDEN,
			);
		}

		const result = await this.visitRepository.listByVisitorId({
			visitorId,
			buildingId,
			page: query.page,
			limit: query.limit,
		});

		return {
			success: true,
			message: "Visitas encontradas com sucesso",
			data: result,
		};
	}

	public async listRecentVisits(
		query: VisitRecentQueryDto,
		buildingId: string,
	): Promise<HttpResponse<RecentVisitItem[]>> {
		const result = await this.visitRepository.findRecent(
			buildingId,
			query.limit,
		);

		return {
			success: true,
			message: "Visitas recentes encontradas com sucesso",
			data: result,
		};
	}
}
