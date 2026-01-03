import type { MongoClient } from "mongodb";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";
import type {
	CreateResidentSuggestionEntity,
	ResidentSuggestionEntity,
} from "../../../database/mongodb/entity/residentSuggestion.entity";
import { ResidentSuggestionRepository } from "../../../database/mongodb/repositories/residentSuggestion.repository";
import { ApartmentRepository } from "../../../database/mongodb/repositories/apartment.repository";
import type {
	ResidentSuggestionCreateDto,
	ResidentSuggestionUpdateDto,
} from "./dto";

export class ResidentSuggestionService {
	private residentSuggestionRepository: ResidentSuggestionRepository;
	private apartmentRepository: ApartmentRepository;

	constructor(mongoClient: MongoClient) {
		this.residentSuggestionRepository = new ResidentSuggestionRepository(mongoClient);
		this.apartmentRepository = new ApartmentRepository(mongoClient);
	}

	public async createSuggestion(
		residentSuggestionCreateDto: ResidentSuggestionCreateDto,
		apartmentId: string,
		buildingId: string,
		actualSeasonId: string,
		fromSeasonId: string,
	): Promise<HttpResponse<ResidentSuggestionEntity>> {
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
			await this.residentSuggestionRepository.countByApartmentId(apartmentId);

		if (currentSuggestionsCount >= 5) {
			throw httpException(
				"Limite de 5 sugestões por apartamento atingido. Para criar uma nova sugestão, exclua uma existente.",
				httpStatus.BAD_REQUEST,
			);
		}

		const residentSuggestionEntity: CreateResidentSuggestionEntity = {
			apartmentId,
			buildingId,
			title: residentSuggestionCreateDto.title,
			description: residentSuggestionCreateDto.description,
			fromSeasonId,
			actualSeasonId,
		};

		const createdResidentSuggestion =
			await this.residentSuggestionRepository.create(residentSuggestionEntity);

		return {
			success: true,
			message: "Sugestão cadastrada com sucesso!",
			data: createdResidentSuggestion,
		};
	}

	public async getAllSuggestionsByApartmentAndSeason(
		apartmentId: string,
		actualSeasonId: string,
	): Promise<HttpResponse<ResidentSuggestionEntity[]>> {
		const residentSuggestions =
			await this.residentSuggestionRepository.findManyByApartmentIdAndSeason(apartmentId, actualSeasonId);

		return {
			success: true,
			message: "Sugestões encontradas com sucesso",
			data: residentSuggestions,
		};
	}

	public async getSuggestionById(
		residentSuggestionId: string,
		apartmentId: string,
	): Promise<HttpResponse<ResidentSuggestionEntity>> {
		const residentSuggestion = await this.residentSuggestionRepository.findById(residentSuggestionId);

		if (!residentSuggestion) {
			throw httpException("Sugestão não encontrada", httpStatus.NOT_FOUND);
		}

		if (residentSuggestion.apartmentId !== apartmentId) {
			throw httpException(
				"Você não tem permissão para acessar esta sugestão",
				httpStatus.FORBIDDEN,
			);
		}

		return {
			success: true,
			message: "Sugestão encontrada com sucesso",
			data: residentSuggestion,
		};
	}

	public async updateSuggestion(
		residentSuggestionId: string,
		residentSuggestionUpdateDto: ResidentSuggestionUpdateDto,
		apartmentId: string,
	): Promise<HttpResponse<ResidentSuggestionEntity>> {
		const residentSuggestion = await this.residentSuggestionRepository.findById(residentSuggestionId);

		if (!residentSuggestion) {
			throw httpException("Sugestão não encontrada", httpStatus.NOT_FOUND);
		}

		if (residentSuggestion.apartmentId !== apartmentId) {
			throw httpException(
				"Você não tem permissão para atualizar esta sugestão",
				httpStatus.FORBIDDEN,
			);
		}

		const updatedResidentSuggestion = await this.residentSuggestionRepository.update(
			residentSuggestionId,
			residentSuggestionUpdateDto,
		);

		if (!updatedResidentSuggestion) {
			throw httpException(
				"Erro ao atualizar sugestão",
				httpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		return {
			success: true,
			message: "Sugestão atualizada com sucesso",
			data: updatedResidentSuggestion,
		};
	}

	public async deleteSuggestion(
		residentSuggestionId: string,
		apartmentId: string,
	): Promise<HttpResponse<null>> {
		const residentSuggestion = await this.residentSuggestionRepository.findById(residentSuggestionId);

		if (!residentSuggestion) {
			throw httpException("Sugestão não encontrada", httpStatus.NOT_FOUND);
		}

		if (residentSuggestion.apartmentId !== apartmentId) {
			throw httpException(
				"Você não tem permissão para deletar esta sugestão",
				httpStatus.FORBIDDEN,
			);
		}

		const deleted = await this.residentSuggestionRepository.delete(residentSuggestionId);

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

	public async getAllSuggestions(): Promise<HttpResponse<ResidentSuggestionEntity[]>> {
		const residentSuggestions = await this.residentSuggestionRepository.findMany();

		return {
			success: true,
			message: "Todas as sugestões encontradas com sucesso",
			data: residentSuggestions,
		};
	}
}
