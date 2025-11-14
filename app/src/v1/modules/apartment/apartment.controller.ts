import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import { ApartmentService } from "./apartment.service";

export class ApartmentController {
	private apartmentService: ApartmentService;

	constructor(mongoClient: MongoClient) {
		this.apartmentService = new ApartmentService(mongoClient);
	}

	public async getAllApartments(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		return reply
			.status(httpStatus.OK)
			.send(await this.apartmentService.getAllApartments());
	}
}

