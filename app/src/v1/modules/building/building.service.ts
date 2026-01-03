import type { MongoClient } from "mongodb";
import type {
	CreateBuildingEntity,
	BuildingEntity,
} from "../../../database/mongodb/entity/building.entity";
import { BuildingRepository } from "../../../database/mongodb/repositories/building.repository";
import type { BuildingCreateDto, BuildingUpdateDto } from "./dto";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";

export class BuildingService {
	private buildingRepository: BuildingRepository;

	constructor(mongoClient: MongoClient) {
		this.buildingRepository = new BuildingRepository(mongoClient);
	}

	public async createBuilding(buildingCreateDto: BuildingCreateDto): Promise<
		HttpResponse<{
			id: string;
			name: string;
			cnpj: string;
		}>
	> {
		const existingBuilding = await this.buildingRepository.findByCnpj(
			buildingCreateDto.cnpj,
		);

		if (existingBuilding) {
			throw httpException(
				"CNPJ já cadastrado no sistema.",
				httpStatus.CONFLICT,
			);
		}

		const buildingEntity: CreateBuildingEntity = {
			name: buildingCreateDto.name,
			cnpj: buildingCreateDto.cnpj,
			state: buildingCreateDto.state,
			city: buildingCreateDto.city,
			address: buildingCreateDto.address,
			addressNumber: buildingCreateDto.addressNumber,
			zipCode: buildingCreateDto.zipCode,
			complement: buildingCreateDto.complement,
			phone: buildingCreateDto.phone,
			floorCount: buildingCreateDto.floorCount,
		};

		const createdBuilding = await this.buildingRepository.create(buildingEntity);

		return {
			success: true,
			message: "Edifício cadastrado com sucesso!",
			data: {
				id: createdBuilding._id,
				name: createdBuilding.name,
				cnpj: createdBuilding.cnpj,
			},
		};
	}

	public async getBuilding(buildingId: string): Promise<
		HttpResponse<BuildingEntity>
	> {
		const building = await this.buildingRepository.findById(buildingId);

		if (!building) {
			throw httpException("Edifício não encontrado", httpStatus.NOT_FOUND);
		}

		return {
			success: true,
			message: "Edifício encontrado com sucesso",
			data: building,
		};
	}

	public async getAllBuildings(): Promise<HttpResponse<BuildingEntity[]>> {
		const buildings = await this.buildingRepository.findMany();

		return {
			success: true,
			message: "Edifícios encontrados com sucesso",
			data: buildings,
		};
	}

	public async updateBuilding(
		buildingId: string,
		buildingUpdateDto: BuildingUpdateDto,
	): Promise<HttpResponse<BuildingEntity>> {
		const building = await this.buildingRepository.findById(buildingId);

		if (!building) {
			throw httpException("Edifício não encontrado", httpStatus.NOT_FOUND);
		}

		if (buildingUpdateDto.cnpj && buildingUpdateDto.cnpj !== building.cnpj) {
			const existingBuilding = await this.buildingRepository.findByCnpj(
				buildingUpdateDto.cnpj,
			);

			if (existingBuilding) {
				throw httpException(
					"CNPJ já cadastrado no sistema.",
					httpStatus.CONFLICT,
				);
			}
		}

		const updatedBuilding = await this.buildingRepository.update(
			buildingId,
			buildingUpdateDto,
		);

		if (!updatedBuilding) {
			throw httpException(
				"Erro ao atualizar edifício",
				httpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		return {
			success: true,
			message: "Edifício atualizado com sucesso",
			data: updatedBuilding,
		};
	}

	public async deleteBuilding(
		buildingId: string,
	): Promise<HttpResponse<null>> {
		const building = await this.buildingRepository.findById(buildingId);

		if (!building) {
			throw httpException("Edifício não encontrado", httpStatus.NOT_FOUND);
		}

		const deleted = await this.buildingRepository.delete(buildingId);

		if (!deleted) {
			throw httpException(
				"Erro ao deletar edifício",
				httpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		return {
			success: true,
			message: "Edifício deletado com sucesso",
			data: null,
		};
	}
}

