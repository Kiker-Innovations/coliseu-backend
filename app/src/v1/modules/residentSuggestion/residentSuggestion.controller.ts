import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import { httpException } from "../../../config/error";
import {
	transformCreateResidentSuggestionDto,
	transformUpdateResidentSuggestionDto,
} from "./dto";
import { ResidentSuggestionService } from "./residentSuggestion.service";
import { UserTypeEnum } from "../../enum/userType.enum";

export class ResidentSuggestionController {
	private residentSuggestionService: ResidentSuggestionService;

	constructor(mongoClient: MongoClient) {
		this.residentSuggestionService = new ResidentSuggestionService(mongoClient);
	}

	public async createSuggestion(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.RESIDENT) {
			throw httpException(
				"Apenas moradores podem criar sugestões",
				httpStatus.FORBIDDEN,
			);
		}

		if (!request.user.apartmentId) {
			throw httpException(
				"Apartamento não encontrado no token",
				httpStatus.BAD_REQUEST,
			);
		}

		if (!request.user.actualSeasonId) {
			throw httpException(
				"Temporada atual não encontrada no token",
				httpStatus.BAD_REQUEST,
			);
		}

		return reply
			.code(httpStatus.CREATED)
			.send(
				await this.residentSuggestionService.createSuggestion(
					transformCreateResidentSuggestionDto(request.body),
					request.user.apartmentId,
					request.user.buildingId,
					request.user.actualSeasonId,
					request.user.actualSeasonId,
				),
			);
	}

	public async getAllSuggestionsByApartmentAndSeason(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.RESIDENT) {
			throw httpException(
				"Apenas moradores podem visualizar suas sugestões",
				httpStatus.FORBIDDEN,
			);
		}

		if (!request.user.apartmentId) {
			throw httpException(
				"Apartamento não encontrado no token",
				httpStatus.BAD_REQUEST,
			);
		}

		if (!request.user.actualSeasonId) {
			throw httpException(
				"Não há temporadas ativas para colocar sugestões.",
				httpStatus.BAD_REQUEST,
			);
		}

		return reply
			.status(httpStatus.OK)
			.send(
				await this.residentSuggestionService.getAllSuggestionsByApartmentAndSeason(
					request.user.apartmentId,
					request.user.actualSeasonId,
				),
			);
	}

	public async getSuggestionById(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.RESIDENT) {
			throw httpException(
				"Apenas moradores podem visualizar suas sugestões",
				httpStatus.FORBIDDEN,
			);
		}

		if (!request.user.apartmentId) {
			throw httpException(
				"Apartamento não encontrado no token",
				httpStatus.BAD_REQUEST,
			);
		}

		const { id } = request.params as { id: string };
		return reply
			.status(httpStatus.OK)
			.send(
				await this.residentSuggestionService.getSuggestionById(
					id,
					request.user.apartmentId,
				),
			);
	}

	public async updateSuggestion(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.RESIDENT) {
			throw httpException(
				"Apenas moradores podem atualizar suas sugestões",
				httpStatus.FORBIDDEN,
			);
		}

		if (!request.user.apartmentId) {
			throw httpException(
				"Apartamento não encontrado no token",
				httpStatus.BAD_REQUEST,
			);
		}

		const { id } = request.params as { id: string };
		return reply
			.status(httpStatus.OK)
			.send(
				await this.residentSuggestionService.updateSuggestion(
					id,
					transformUpdateResidentSuggestionDto(request.body),
					request.user.apartmentId,
				),
			);
	}

	public async deleteSuggestion(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.RESIDENT) {
			throw httpException(
				"Apenas moradores podem deletar suas sugestões",
				httpStatus.FORBIDDEN,
			);
		}

		if (!request.user.apartmentId) {
			throw httpException(
				"Apartamento não encontrado no token",
				httpStatus.BAD_REQUEST,
			);
		}

		const { id } = request.params as { id: string };
		return reply
			.status(httpStatus.OK)
			.send(
				await this.residentSuggestionService.deleteSuggestion(
					id,
					request.user.apartmentId,
				),
			);
	}

	public async getAllSuggestions(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.ADMIN) {
			throw httpException(
				"Apenas administradores podem visualizar todas as sugestões",
				httpStatus.FORBIDDEN,
			);
		}

		return reply
			.status(httpStatus.OK)
			.send(await this.residentSuggestionService.getAllSuggestions());
	}
}
