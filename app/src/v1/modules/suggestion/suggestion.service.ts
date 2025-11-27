import type { MongoClient } from "mongodb";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";
import type {
	CreateSuggestionEntity,
	SuggestionEntity,
} from "../../../database/mongodb/entity/suggestion.entity";
import { SuggestionRepository } from "../../../database/mongodb/repositories/suggestion.repository";
import { ApartmentRepository } from "../../../database/mongodb/repositories/apartment.repository";
import type {
	SuggestionCreateDto,
	SuggestionUpdateDto,
} from "./dto";

export class SuggestionService {
	private suggestionRepository: SuggestionRepository;
	private apartmentRepository: ApartmentRepository;

	constructor(mongoClient: MongoClient) {
		this.suggestionRepository = new SuggestionRepository(mongoClient);
		this.apartmentRepository = new ApartmentRepository(mongoClient);
	}

	public async createSuggestion(
		suggestionCreateDto: SuggestionCreateDto,
		apartmentId: string,
		buildingId: string,
	): Promise<HttpResponse<SuggestionEntity>> {
		const apartment = await this.apartmentRepository.findById(apartmentId);
		if (!apartment) {
			throw httpException("Apartamento não encontrado", httpStatus.NOT_FOUND);
		}

		if (apartment.buildingId !== buildingId) {
			throw httpException(
				"Apartamento não pertence ao edifício do usuário",
				httpStatus.FORBIDDEN,
			);
		}

		const currentSuggestionsCount =
			await this.suggestionRepository.countByApartmentId(apartmentId);

		if (currentSuggestionsCount >= 5) {
			throw httpException(
				"Limite de 5 sugestões por apartamento atingido. Para criar uma nova sugestão, exclua uma existente.",
				httpStatus.BAD_REQUEST,
			);
		}

		const suggestionEntity: CreateSuggestionEntity = {
			apartmentId,
			buildingId,
			title: suggestionCreateDto.title,
			description: suggestionCreateDto.description,
		};

		const createdSuggestion =
			await this.suggestionRepository.create(suggestionEntity);

		return {
			success: true,
			message: "Sugestão cadastrada com sucesso!",
			data: createdSuggestion,
		};
	}

	public async getAllSuggestionsByApartment(
		apartmentId: string,
	): Promise<HttpResponse<SuggestionEntity[]>> {
		const suggestions =
			await this.suggestionRepository.findManyByApartmentId(apartmentId);

		return {
			success: true,
			message: "Sugestões encontradas com sucesso",
			data: suggestions,
		};
	}

	public async getSuggestionById(
		suggestionId: string,
		apartmentId: string,
	): Promise<HttpResponse<SuggestionEntity>> {
		const suggestion = await this.suggestionRepository.findById(suggestionId);

		if (!suggestion) {
			throw httpException("Sugestão não encontrada", httpStatus.NOT_FOUND);
		}

		if (suggestion.apartmentId !== apartmentId) {
			throw httpException(
				"Você não tem permissão para acessar esta sugestão",
				httpStatus.FORBIDDEN,
			);
		}

		return {
			success: true,
			message: "Sugestão encontrada com sucesso",
			data: suggestion,
		};
	}

	public async updateSuggestion(
		suggestionId: string,
		suggestionUpdateDto: SuggestionUpdateDto,
		apartmentId: string,
	): Promise<HttpResponse<SuggestionEntity>> {
		const suggestion = await this.suggestionRepository.findById(suggestionId);

		if (!suggestion) {
			throw httpException("Sugestão não encontrada", httpStatus.NOT_FOUND);
		}

		if (suggestion.apartmentId !== apartmentId) {
			throw httpException(
				"Você não tem permissão para atualizar esta sugestão",
				httpStatus.FORBIDDEN,
			);
		}

		const updatedSuggestion = await this.suggestionRepository.update(
			suggestionId,
			suggestionUpdateDto,
		);

		if (!updatedSuggestion) {
			throw httpException(
				"Erro ao atualizar sugestão",
				httpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		return {
			success: true,
			message: "Sugestão atualizada com sucesso",
			data: updatedSuggestion,
		};
	}

	public async deleteSuggestion(
		suggestionId: string,
		apartmentId: string,
	): Promise<HttpResponse<null>> {
		const suggestion = await this.suggestionRepository.findById(suggestionId);

		if (!suggestion) {
			throw httpException("Sugestão não encontrada", httpStatus.NOT_FOUND);
		}

		if (suggestion.apartmentId !== apartmentId) {
			throw httpException(
				"Você não tem permissão para deletar esta sugestão",
				httpStatus.FORBIDDEN,
			);
		}

		const deleted = await this.suggestionRepository.delete(suggestionId);

		if (!deleted) {
			throw httpException(
				"Erro ao deletar sugestão",
				httpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		return {
			success: true,
			message: "Sugestão deletada com sucesso",
			data: null,
		};
	}

	public async getAllSuggestions(): Promise<HttpResponse<SuggestionEntity[]>> {
		const suggestions = await this.suggestionRepository.findMany();

		return {
			success: true,
			message: "Todas as sugestões encontradas com sucesso",
			data: suggestions,
		};
	}
}

