import type { MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
	CreateVisitorEntity,
	VisitorEntity,
} from "../../../database/mongodb/entity/visitor.entity";
import { VisitorRepository } from "../../../database/mongodb/repositories/visitor.repository";
import { ApartmentRepository } from "../../../database/mongodb/repositories/apartment.repository";
import { ConciergeRepository } from "../../../database/mongodb/repositories/concierge.repository";
import { S3Provider } from "../../../providers/aws/s3.provider";
import type {
	VisitorCreateDto,
	VisitorListQueryDto,
	VisitorRecentQueryDto,
	VisitorUpdateDto,
} from "./dto";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";
import { getDate } from "@/v1/utils/utils";

export class VisitorService {
	private visitorRepository: VisitorRepository;
	private apartmentRepository: ApartmentRepository;
	private conciergeRepository: ConciergeRepository;
	private s3Provider: S3Provider;

	constructor(mongoClient: MongoClient) {
		this.visitorRepository = new VisitorRepository(mongoClient);
		this.apartmentRepository = new ApartmentRepository(mongoClient);
		this.conciergeRepository = new ConciergeRepository(mongoClient);
		this.s3Provider = new S3Provider();
	}

	public async createVisitor(
		visitorCreateDto: VisitorCreateDto,
		buildingId: string,
		conciergeId: string,
	): Promise<
		HttpResponse<{
			_id: string;
			name: string;
			email?: string;
			phone?: string;
			presignedUrl: string;
		}>
	> {
		// Validate document uniqueness if provided
		if (visitorCreateDto.document) {
			const existingVisitor = await this.visitorRepository.findByDocument(
				visitorCreateDto.document,
				buildingId,
			);
			if (existingVisitor) {
				throw httpException(
					"Já existe um visitante com este documento neste edifício",
					httpStatus.CONFLICT,
				);
			}
		}

		// Get concierge name
		const concierge = await this.conciergeRepository.findById(conciergeId);
		if (!concierge) {
			throw httpException("Porteiro não encontrado", httpStatus.NOT_FOUND);
		}

		// Create visitor entity
		const visitorEntity: CreateVisitorEntity = {
			name: visitorCreateDto.name,
			email: visitorCreateDto.email,
			document: visitorCreateDto.document,
			phone: visitorCreateDto.phone,
			vehicleType: visitorCreateDto.vehicleType,
			vehiclePlate: visitorCreateDto.vehiclePlate,
			types: visitorCreateDto.types,
			photoUrl: "",
			note: visitorCreateDto.note,
			registeredBy: concierge.name,
			registeredAt: getDate(),
			buildingId,
			active: true,
		};

		const createdVisitor = await this.visitorRepository.create(visitorEntity);

		// Generate presigned URL automatically (like residents)
		const { presignedUrl, publicUrl } = await this.generatePresignedUrl(
			createdVisitor._id,
			"jpg",
		);

		// Update visitor with photoUrl
		await this.visitorRepository.update(createdVisitor._id, {
			photoUrl: publicUrl,
		});

		return {
			success: true,
			message: "Visitante cadastrado com sucesso",
			data: {
				_id: createdVisitor._id,
				name: createdVisitor.name,
				email: createdVisitor.email,
				phone: createdVisitor.phone,
				presignedUrl,
			},
		};
	}

	private async generatePresignedUrl(
		visitorId: string,
		fileExtension: string,
	): Promise<{
		presignedUrl: string;
		s3Key: string;
		expiresIn: string;
		publicUrl: string;
	}> {
		const fileName = `${visitorId}-photo.${fileExtension}`;
		const s3Key = `${env.providers.aws.s3.folders.visitor}/${visitorId}/${fileName}`;

		const contentTypeMap: Record<string, string> = {
			jpg: "image/jpeg",
			jpeg: "image/jpeg",
			png: "image/png",
			webp: "image/webp",
		};

		const contentType =
			contentTypeMap[fileExtension.toLowerCase()] || "application/octet-stream";

		const presignedUrl = await this.s3Provider.getPresignedUrlForPut(
			s3Key,
			contentType,
			60,
		);
		const publicUrl = this.s3Provider.getPublicUrl(s3Key);

		return {
			presignedUrl,
			publicUrl,
			s3Key,
			expiresIn: `${env.providers.aws.s3.presignedUrlExpiration} segundos`,
		};
	}

	public async listVisitors(
		query: VisitorListQueryDto,
		buildingId: string,
	): Promise<
		HttpResponse<{
			data: {
				_id: string;
				name: string;
				phone?: string;
				vehicleType?: string;
				vehiclePlate?: string;
				apartmentId?: string;
				types: string[];
				photoUrl: string;
				note?: string;
				active: boolean;
				apartmentNumber?: string;
			}[];
			total: number;
			page: number;
			limit: number;
			totalPages: number;
		}>
	> {
		const result = await this.visitorRepository.listWithFilters({
			buildingId,
			search: query.search,
			filterBy: query.filterBy,
			page: query.page,
			limit: query.limit,
		});

		return {
			success: true,
			message: "Visitantes encontrados com sucesso",
			data: result,
		};
	}

	public async getVisitorById(
		visitorId: string,
		buildingId: string,
	): Promise<HttpResponse<VisitorEntity & { apartmentNumber?: string }>> {
		const visitor = await this.visitorRepository.findById(visitorId);

		if (!visitor) {
			throw httpException("Visitante não encontrado", httpStatus.NOT_FOUND);
		}

		if (visitor.buildingId !== buildingId) {
			throw httpException(
				"Visitante não pertence ao mesmo edifício",
				httpStatus.FORBIDDEN,
			);
		}

		return {
			success: true,
			message: "Visitante encontrado com sucesso",
			data: visitor,
		};
	}

	public async updateVisitor(
		visitorId: string,
		visitorUpdateDto: VisitorUpdateDto,
		buildingId: string,
		conciergeId: string,
	): Promise<HttpResponse<VisitorEntity>> {
		// Check if visitor exists and belongs to the building
		const visitor = await this.visitorRepository.findById(visitorId);

		if (!visitor) {
			throw httpException("Visitante não encontrado", httpStatus.NOT_FOUND);
		}

		if (visitor.buildingId !== buildingId) {
			throw httpException(
				"Visitante não pertence ao mesmo edifício",
				httpStatus.FORBIDDEN,
			);
		}

		// Validate document uniqueness if provided and different from current
		if (
			visitorUpdateDto.document &&
			visitorUpdateDto.document !== visitor.document
		) {
			const existingVisitor = await this.visitorRepository.findByDocument(
				visitorUpdateDto.document,
				buildingId,
			);
			if (existingVisitor && existingVisitor._id !== visitorId) {
				throw httpException(
					"Já existe um visitante com este documento neste edifício",
					httpStatus.CONFLICT,
				);
			}
		}

		// Get concierge name
		const concierge = await this.conciergeRepository.findById(conciergeId);
		if (!concierge) {
			throw httpException("Porteiro não encontrado", httpStatus.NOT_FOUND);
		}

		// Prepare update data
		const updateData: Partial<VisitorEntity> = {
			...visitorUpdateDto,
			updatedBy: concierge.name,
			updatedAt: getDate(),
		};

		// Update visitor
		const updatedVisitor = await this.visitorRepository.update(
			visitorId,
			updateData,
		);

		if (!updatedVisitor) {
			throw httpException(
				"Erro ao atualizar visitante",
				httpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		return {
			success: true,
			message: "Visitante atualizado com sucesso",
			data: updatedVisitor,
		};
	}

	public async listRecentVisitors(
		query: VisitorRecentQueryDto,
		buildingId: string,
	): Promise<
		HttpResponse<
			{
				_id: string;
				name: string;
				phone?: string;
				vehicleType?: string;
				vehiclePlate?: string;
				types: string[];
				photoUrl: string;
				note?: string;
				active: boolean;
				apartmentNumber?: string;
			}[]
		>
	> {
		const visitors = await this.visitorRepository.findRecent(
			buildingId,
			query.limit,
		);

		return {
			success: true,
			message: "Últimos visitantes encontrados com sucesso",
			data: visitors,
		};
	}
}
