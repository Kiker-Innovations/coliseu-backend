import type { MongoClient } from "mongodb";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";
import type {
	CreateProjectOfferEntity,
	ProjectOfferEntity,
} from "../../../database/mongodb/entity/projectOffer.entity";
import { ProjectOfferRepository } from "../../../database/mongodb/repositories/projectOffer.repository";
import { ProjectRepository } from "../../../database/mongodb/repositories/project.repository";
import type { ProjectOfferCreateDto } from "./dto";

export class ProjectOfferService {
	private projectOfferRepository: ProjectOfferRepository;
	private projectRepository: ProjectRepository;

	constructor(mongoClient: MongoClient) {
		this.projectOfferRepository = new ProjectOfferRepository(mongoClient);
		this.projectRepository = new ProjectRepository(mongoClient);
	}

	public async createProjectOffers(
		projectOfferCreateDto: ProjectOfferCreateDto,
		buildingId: string,
		seasonId: string,
	): Promise<HttpResponse<ProjectOfferEntity[]>> {
		const project = await this.projectRepository.findById(
			projectOfferCreateDto.projectId,
		);

		if (!project) {
			throw httpException("Projeto não encontrado", httpStatus.NOT_FOUND);
		}

		if (project.buildingId !== buildingId) {
			throw httpException(
				"Você não tem permissão para cadastrar ofertas neste projeto",
				httpStatus.FORBIDDEN,
			);
		}

		const existingOffers = await this.projectOfferRepository.findManyByProjectId(
			projectOfferCreateDto.projectId,
		);

		if (existingOffers.length > 0) {
			throw httpException(
				"Este projeto já possui ofertas cadastradas. Delete as ofertas existentes antes de cadastrar novas.",
				httpStatus.BAD_REQUEST,
			);
		}

		const offerStartDate = new Date(projectOfferCreateDto.offerStartDate);
		const offerEndDate = new Date(projectOfferCreateDto.offerEndDate);

		if (offerStartDate >= offerEndDate) {
			throw httpException(
				"A data de início das ofertas deve ser anterior à data de término",
				httpStatus.BAD_REQUEST,
			);
		}

		await this.projectRepository.update(projectOfferCreateDto.projectId, {
			offerStartDate,
			offerEndDate,
		});

		const offersToCreate: CreateProjectOfferEntity[] =
			projectOfferCreateDto.offers.map((offer) => ({
				buildingId,
				seasonId,
				projectId: projectOfferCreateDto.projectId,
				companyName: offer.companyName,
				description: offer.description,
				companyCnpj: offer.companyCnpj,
				totalValue: offer.totalValue,
				installmentsCount: offer.installmentsCount,
				votes: 0,
			}));

		const createdOffers =
			await this.projectOfferRepository.createMany(offersToCreate);

		return {
			success: true,
			message: "Ofertas cadastradas com sucesso!",
			data: createdOffers,
		};
	}

	public async getAllOffersByProject(
		projectId: string,
		buildingId: string,
		seasonId: string,
	): Promise<HttpResponse<ProjectOfferEntity[]>> {
		const project = await this.projectRepository.findById(projectId);

		if (!project) {
			throw httpException("Projeto não encontrado", httpStatus.NOT_FOUND);
		}

		if (project.buildingId !== buildingId) {
			throw httpException(
				"Você não tem permissão para acessar as ofertas deste projeto",
				httpStatus.FORBIDDEN,
			);
		}

		const offers =
			await this.projectOfferRepository.findManyByBuildingSeasonAndProject(
				buildingId,
				seasonId,
				projectId,
			);

		return {
			success: true,
			message: "Ofertas encontradas com sucesso",
			data: offers,
		};
	}

	public async getOfferById(
		offerId: string,
		buildingId: string,
	): Promise<HttpResponse<ProjectOfferEntity>> {
		const offer = await this.projectOfferRepository.findById(offerId);

		if (!offer) {
			throw httpException("Oferta não encontrada", httpStatus.NOT_FOUND);
		}

		if (offer.buildingId !== buildingId) {
			throw httpException(
				"Você não tem permissão para acessar esta oferta",
				httpStatus.FORBIDDEN,
			);
		}

		return {
			success: true,
			message: "Oferta encontrada com sucesso",
			data: offer,
		};
	}

	public async deleteOffersByProject(
		projectId: string,
		buildingId: string,
	): Promise<HttpResponse<null>> {
		const project = await this.projectRepository.findById(projectId);

		if (!project) {
			throw httpException("Projeto não encontrado", httpStatus.NOT_FOUND);
		}

		if (project.buildingId !== buildingId) {
			throw httpException(
				"Você não tem permissão para deletar ofertas deste projeto",
				httpStatus.FORBIDDEN,
			);
		}

		if (project.chosenOfferId) {
			throw httpException(
				"Não é possível deletar ofertas de um projeto que já possui oferta escolhida",
				httpStatus.BAD_REQUEST,
			);
		}

		await this.projectOfferRepository.deleteByProjectId(projectId);

		await this.projectRepository.update(projectId, {
			offerStartDate: undefined,
			offerEndDate: undefined,
		});

		return {
			success: true,
			message: "Ofertas deletadas com sucesso",
			data: null,
		};
	}
}

