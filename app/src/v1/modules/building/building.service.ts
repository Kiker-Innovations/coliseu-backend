import type { MongoClient } from "mongodb";
import type { BuildingEntity } from "../../../database/mongodb/entity/building.entity";
import { BuildingRepository } from "../../../database/mongodb/repositories/building.repository";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";

export class BuildingService {
	private buildingRepository: BuildingRepository;

	constructor(mongoClient: MongoClient) {
		this.buildingRepository = new BuildingRepository(mongoClient);
	}

	public async getBuilding(
		buildingId: string,
	): Promise<HttpResponse<BuildingEntity>> {
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
}
