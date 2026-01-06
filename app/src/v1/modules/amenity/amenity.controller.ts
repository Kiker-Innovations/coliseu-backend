import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import {
	transformCreateAmenityDto,
	transformUpdateAmenityDto,
	transformAmenityListQueryDto,
} from "./dto";
import { AmenityService } from "./amenity.service";
import { UserTypeEnum } from "../../enum/userType.enum";
import { httpException } from "../../../config/error";

export class AmenityController {
	private amenityService: AmenityService;

	constructor(mongoClient: MongoClient) {
		this.amenityService = new AmenityService(mongoClient);
	}

	public async createAmenity(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		return reply
			.code(httpStatus.CREATED)
			.send(
				await this.amenityService.createAmenity(
					transformCreateAmenityDto(request.body),
				),
			);
	}

	public async getAmenity(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const { id } = request.params as { id: string };
		return reply
			.status(httpStatus.OK)
			.send(await this.amenityService.getAmenity(id));
	}

	public async getAllAmenitiesByBuilding(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		try {
			const buildingId = request.user?.buildingId;

			if (!buildingId) {
				return reply.status(httpStatus.BAD_REQUEST).send({
					success: false,
					message: "ID do edifício não encontrado no token",
				});
			}

			return reply
				.status(httpStatus.OK)
				.send(await this.amenityService.getAllAmenitiesByBuilding(buildingId));
		} catch (error: any) {
			console.error("Erro ao buscar comodidades:", error);
			return reply.status(httpStatus.INTERNAL_SERVER_ERROR).send({
				success: false,
				message: error.message || "Erro ao buscar comodidades",
			});
		}
	}

	public async updateAmenity(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const { id } = request.params as { id: string };
		return reply
			.status(httpStatus.OK)
			.send(
				await this.amenityService.updateAmenity(
					id,
					transformUpdateAmenityDto(request.body),
				),
			);
	}

	public async deleteAmenity(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const { id } = request.params as { id: string };
		return reply
			.status(httpStatus.OK)
			.send(await this.amenityService.deleteAmenity(id));
	}

	public async countAmenitiesByBuilding(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		try {
			const { buildingId } = request.query as { buildingId: string };

			if (!buildingId) {
				return reply.status(httpStatus.BAD_REQUEST).send({
					success: false,
					message: "ID do edifício não fornecido",
				});
			}

			return reply
				.status(httpStatus.OK)
				.send(await this.amenityService.countAmenitiesByBuilding(buildingId));
		} catch (error: any) {
			console.error("Erro ao contar comodidades:", error);
			return reply.status(httpStatus.INTERNAL_SERVER_ERROR).send({
				success: false,
				message: error.message || "Erro ao contar comodidades",
			});
		}
	}

	public async getActiveCommoditiesForResident(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		// Verificar se o usuário é um residente
		if (request.user?.userType !== UserTypeEnum.RESIDENT) {
			throw httpException(
				"Apenas moradores podem visualizar comodidades ativas",
				httpStatus.FORBIDDEN,
			);
		}

		const buildingId = request.user?.buildingId;

		if (!buildingId) {
			return reply.status(httpStatus.BAD_REQUEST).send({
				success: false,
				message: "ID do edifício não encontrado no token",
			});
		}

		return reply
			.status(httpStatus.OK)
			.send(
				await this.amenityService.getActiveCommoditiesByBuilding(buildingId),
			);
	}
}
