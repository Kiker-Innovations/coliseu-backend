import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import { httpException } from "../../../config/error";
import {
	transformCreateSuggestionDto,
	transformUpdateSuggestionDto,
} from "./dto";
import { SuggestionService } from "./suggestion.service";
import { UserTypeEnum } from "../../enum/userType.enum";

export class SuggestionController {
	private suggestionService: SuggestionService;

	constructor(mongoClient: MongoClient) {
		this.suggestionService = new SuggestionService(mongoClient);
	}

	public async createSuggestion(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (!request.user) {
			throw httpException(
				"Usuário não autenticado",
				httpStatus.UNAUTHORIZED,
			);
		}

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

		return reply
			.code(httpStatus.CREATED)
			.send(
				await this.suggestionService.createSuggestion(
					transformCreateSuggestionDto(request.body),
					request.user.apartmentId,
					request.user.buildingId,
				),
			);
	}

	public async getAllSuggestionsByApartment(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (!request.user) {
			throw httpException(
				"Usuário não autenticado",
				httpStatus.UNAUTHORIZED,
			);
		}

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

		return reply
			.status(httpStatus.OK)
			.send(
				await this.suggestionService.getAllSuggestionsByApartment(
					request.user.apartmentId,
				),
			);
	}

	public async getSuggestionById(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (!request.user) {
			throw httpException(
				"Usuário não autenticado",
				httpStatus.UNAUTHORIZED,
			);
		}

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
				await this.suggestionService.getSuggestionById(
					id,
					request.user.apartmentId,
				),
			);
	}

	public async updateSuggestion(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (!request.user) {
			throw httpException(
				"Usuário não autenticado",
				httpStatus.UNAUTHORIZED,
			);
		}

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
				await this.suggestionService.updateSuggestion(
					id,
					transformUpdateSuggestionDto(request.body),
					request.user.apartmentId,
				),
			);
	}

	public async deleteSuggestion(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (!request.user) {
			throw httpException(
				"Usuário não autenticado",
				httpStatus.UNAUTHORIZED,
			);
		}

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
				await this.suggestionService.deleteSuggestion(
					id,
					request.user.apartmentId,
				),
			);
	}

	public async getAllSuggestions(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (!request.user) {
			throw httpException(
				"Usuário não autenticado",
				httpStatus.UNAUTHORIZED,
			);
		}

		if (request.user.userType !== UserTypeEnum.ADMIN) {
			throw httpException(
				"Apenas administradores podem visualizar todas as sugestões",
				httpStatus.FORBIDDEN,
			);
		}

		return reply
			.status(httpStatus.OK)
			.send(await this.suggestionService.getAllSuggestions());
	}
}

