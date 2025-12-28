import type { MongoClient } from "mongodb";
import type {
	CreateAmenityEntity,
	AmenityEntity,
} from "../../../database/mongodb/entity/amenity.entity";
import { AmenityRepository } from "../../../database/mongodb/repositories/amenity.repository";
import type { AmenityCreateDto, AmenityUpdateDto } from "./dto";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";

export class AmenityService {
	private amenityRepository: AmenityRepository;

	constructor(mongoClient: MongoClient) {
		this.amenityRepository = new AmenityRepository(mongoClient);
	}

	public async createAmenity(amenityCreateDto: AmenityCreateDto): Promise<
		HttpResponse<{
			id: string;
			buildingId: string;
			name: string;
		}>
	> {
		// Se o tipo for AREA_COMUM, não incluir value e fineValue
		const amenityEntity: CreateAmenityEntity = {
			buildingId: amenityCreateDto.buildingId,
			name: amenityCreateDto.name,
			description: amenityCreateDto.description,
			type: amenityCreateDto.type, // Sempre incluir o tipo se fornecido
			value: amenityCreateDto.type === "AREA_COMUM" ? undefined : amenityCreateDto.value,
			fineValue: amenityCreateDto.type === "AREA_COMUM" ? undefined : amenityCreateDto.fineValue,
			nonComplianceFine: amenityCreateDto.type === "AREA_COMUM" ? undefined : amenityCreateDto.nonComplianceFine,
			maxResidents: amenityCreateDto.maxResidents,
			usageRules: amenityCreateDto.usageRules,
			bookingType: amenityCreateDto.bookingType,
			maxHours: amenityCreateDto.maxHours,
			status: amenityCreateDto.status,
		};

		const createdAmenity = await this.amenityRepository.create(amenityEntity);

		return {
			success: true,
			message: "Comodidade cadastrada com sucesso!",
			data: {
				id: createdAmenity._id,
				buildingId: createdAmenity.buildingId,
				name: createdAmenity.name,
			},
		};
	}

	public async getAmenity(amenityId: string): Promise<
		HttpResponse<AmenityEntity>
	> {
		const amenity = await this.amenityRepository.findById(amenityId);

		if (!amenity) {
			throw httpException("Comodidade não encontrada", httpStatus.NOT_FOUND);
		}

		return {
			success: true,
			message: "Comodidade encontrada com sucesso",
			data: amenity,
		};
	}

	public async getAllAmenitiesByBuilding(
		buildingId: string,
	): Promise<HttpResponse<AmenityEntity[]>> {
		if (!buildingId) {
			throw httpException(
				"ID do edifício é obrigatório",
				httpStatus.BAD_REQUEST,
			);
		}

		const amenities = await this.amenityRepository.findMany({ buildingId });

		return {
			success: true,
			message: "Comodidades encontradas com sucesso",
			data: amenities,
		};
	}

	public async getActiveCommoditiesByBuilding(
		buildingId: string,
	): Promise<HttpResponse<AmenityEntity[]>> {
		const amenities = await this.amenityRepository.findMany({
			buildingId,
			status: "ATIVO",
		});

		return {
			success: true,
			message: "Comodidades ativas encontradas com sucesso",
			data: amenities,
		};
	}

	public async updateAmenity(
		amenityId: string,
		amenityUpdateDto: AmenityUpdateDto,
	): Promise<HttpResponse<AmenityEntity>> {
		const amenity = await this.amenityRepository.findById(amenityId);

		if (!amenity) {
			throw httpException("Comodidade não encontrada", httpStatus.NOT_FOUND);
		}

		// Se o tipo for AREA_COMUM, remover value e fineValue explicitamente
		const updateData: any = { ...amenityUpdateDto };
		if (updateData.type === "AREA_COMUM" || amenity.type === "AREA_COMUM") {
			// Marcar campos para remoção usando null (será tratado no repository com $unset)
			updateData.value = null;
			updateData.fineValue = null;
		}

		const updatedAmenity = await this.amenityRepository.update(
			amenityId,
			updateData,
		);

		if (!updatedAmenity) {
			throw httpException(
				"Erro ao atualizar comodidade",
				httpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		return {
			success: true,
			message: "Comodidade atualizada com sucesso",
			data: updatedAmenity,
		};
	}

	public async deleteAmenity(
		amenityId: string,
	): Promise<HttpResponse<null>> {
		const amenity = await this.amenityRepository.findById(amenityId);

		if (!amenity) {
			throw httpException("Comodidade não encontrada", httpStatus.NOT_FOUND);
		}

		const deleted = await this.amenityRepository.delete(amenityId);

		if (!deleted) {
			throw httpException(
				"Erro ao deletar comodidade",
				httpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		return {
			success: true,
			message: "Comodidade deletada com sucesso",
			data: null,
		};
	}

	public async countAmenitiesByBuilding(
		buildingId: string,
	): Promise<HttpResponse<number>> {
		if (!buildingId) {
			throw httpException(
				"ID do edifício é obrigatório",
				httpStatus.BAD_REQUEST,
			);
		}

		const count = await this.amenityRepository.count({ buildingId });

		return {
			success: true,
			message: "Contagem de comodidades realizada com sucesso",
			data: count,
		};
	}
}

