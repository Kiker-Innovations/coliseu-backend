import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { ProjectOfferController } from "./projectOffer.controller";
import { ProjectOfferSchema } from "./projectOffer.schema";

export class ProjectOfferRouteV1 {
	private projectOfferController: ProjectOfferController;
	private projectOfferSchema: ProjectOfferSchema;

	constructor(mongoClient: MongoClient) {
		this.projectOfferController = new ProjectOfferController(mongoClient);
		this.projectOfferSchema = new ProjectOfferSchema();
	}

	private create = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/project-offers",
			schema: {
				tags: ["Project Offers"],
				summary: "Create project offers",
				description: "Cadastra ofertas para um projeto (mínimo 2, máximo 10)",
				...this.projectOfferSchema.create,
			},
			handler: this.projectOfferController.createProjectOffers.bind(
				this.projectOfferController,
			) as RouteHandlerMethod,
		};
	};

	private getAllByProject = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/project-offers/project/:projectId",
			schema: {
				tags: ["Project Offers"],
				summary: "Get all offers by project",
				description: "Lista todas as ofertas de um projeto específico",
				...this.projectOfferSchema.getAllByProject,
			},
			handler: this.projectOfferController.getAllOffersByProject.bind(
				this.projectOfferController,
			) as RouteHandlerMethod,
		};
	};

	private getById = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/project-offers/:id",
			schema: {
				tags: ["Project Offers"],
				summary: "Get offer by ID",
				description: "Busca uma oferta específica por ID",
				...this.projectOfferSchema.getById,
			},
			handler: this.projectOfferController.getOfferById.bind(
				this.projectOfferController,
			) as RouteHandlerMethod,
		};
	};

	private deleteByProject = (): RouteOptions => {
		return {
			method: "DELETE",
			url: "/v1/project-offers/project/:projectId",
			schema: {
				tags: ["Project Offers"],
				summary: "Delete all offers by project",
				description: "Deleta todas as ofertas de um projeto",
				...this.projectOfferSchema.deleteByProject,
			},
			handler: this.projectOfferController.deleteOffersByProject.bind(
				this.projectOfferController,
			) as RouteHandlerMethod,
		};
	};

	public routes = (): RouteOptions[] => {
		return [
			this.create(),
			this.getAllByProject(),
			this.getById(),
			this.deleteByProject(),
		];
	};
}

