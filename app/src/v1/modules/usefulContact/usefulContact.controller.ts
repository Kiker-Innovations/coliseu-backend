import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import {
	transformUsefulContactCreateDto,
	transformUsefulContactUpdateDto,
} from "./dto";
import { UsefulContactService } from "./usefulContact.service";

export class UsefulContactController {
	private usefulContactService: UsefulContactService;

	constructor(mongoClient: MongoClient) {
		this.usefulContactService = new UsefulContactService(mongoClient);
	}

	public async createUsefulContact(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const buildingId = (request.user as any).buildingId;
		return reply
			.code(httpStatus.CREATED)
			.send(
				await this.usefulContactService.createUsefulContact(
					transformUsefulContactCreateDto(request.body),
					buildingId,
				),
			);
	}

	public async getUsefulContactsByBuilding(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const buildingId = (request.user as any).buildingId;
		return reply
			.code(httpStatus.OK)
			.send(
				await this.usefulContactService.getUsefulContactsByBuilding(buildingId),
			);
	}

	public async getUsefulContactById(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const { id } = request.params as { id: string };
		return reply
			.code(httpStatus.OK)
			.send(
				await this.usefulContactService.getUsefulContactById(id),
			);
	}

	public async updateUsefulContact(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const { id } = request.params as { id: string };
		return reply
			.code(httpStatus.OK)
			.send(
				await this.usefulContactService.updateUsefulContact(
					id,
					transformUsefulContactUpdateDto(request.body),
				),
			);
	}

	public async deleteUsefulContact(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const { id } = request.params as { id: string };
		return reply
			.code(httpStatus.OK)
			.send(
				await this.usefulContactService.deleteUsefulContact(id),
			);
	}
}

