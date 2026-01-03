import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import {
	transformCreateBuildingDto,
	transformUpdateBuildingDto,
} from "./dto";
import { BuildingService } from "./building.service";

export class BuildingController {
	private buildingService: BuildingService;

	constructor(mongoClient: MongoClient) {
		this.buildingService = new BuildingService(mongoClient);
	}

	public async createBuilding(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		return reply
			.code(httpStatus.CREATED)
			.send(
				await this.buildingService.createBuilding(
					transformCreateBuildingDto(request.body),
				),
			);
	}

	public async getBuilding(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const { id } = request.params as { id: string };
		return reply
			.status(httpStatus.OK)
			.send(await this.buildingService.getBuilding(id));
	}

	public async getAllBuildings(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		return reply
			.status(httpStatus.OK)
			.send(await this.buildingService.getAllBuildings());
	}

	public async updateBuilding(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const { id } = request.params as { id: string };
		return reply
			.status(httpStatus.OK)
			.send(
				await this.buildingService.updateBuilding(
					id,
					transformUpdateBuildingDto(request.body),
				),
			);
	}

	public async deleteBuilding(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const { id } = request.params as { id: string };
		return reply
			.status(httpStatus.OK)
			.send(await this.buildingService.deleteBuilding(id));
	}
}

