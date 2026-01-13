import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import { ApartmentService } from "./apartment.service";

export class ApartmentController {
	private apartmentService: ApartmentService;

	constructor(mongoClient: MongoClient) {
		this.apartmentService = new ApartmentService(mongoClient);
	}

	public async getApartment(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const { id } = request.params as { id: string };
		return reply
			.status(httpStatus.OK)
			.send(await this.apartmentService.getApartment(id));
	}

	public async getAllApartmentsByBuilding(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const { buildingId } = request.query as { buildingId: string };
		return reply
			.status(httpStatus.OK)
			.send(await this.apartmentService.getAllApartmentsByBuilding(buildingId));
	}
}
