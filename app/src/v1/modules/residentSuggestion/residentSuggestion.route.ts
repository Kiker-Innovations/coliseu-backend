import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { ResidentSuggestionController } from "./residentSuggestion.controller";
import { ResidentSuggestionSchema } from "./residentSuggestion.schema";
import { AuthMiddleware } from "../auth/auth.middleware";

const MODULE_TAG = "resident-suggestion";

export class ResidentSuggestionRouteV1 {
	private residentSuggestionController: ResidentSuggestionController;
	private residentSuggestionSchema: ResidentSuggestionSchema;
	private authMiddleware: AuthMiddleware;

	constructor(mongoClient: MongoClient) {
		this.residentSuggestionController = new ResidentSuggestionController(
			mongoClient,
		);
		this.residentSuggestionSchema = new ResidentSuggestionSchema();
		this.authMiddleware = new AuthMiddleware(mongoClient);
	}

	private create = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/resident-suggestions",
			schema: {
				tags: ["Resident Suggestions"],
				summary: "Create a new resident suggestion",
				description: "Cria uma nova sugestão para o apartamento do morador",
				...this.residentSuggestionSchema.create,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "create"),
			],
			handler: this.residentSuggestionController.createSuggestion.bind(
				this.residentSuggestionController,
			) as RouteHandlerMethod,
		};
	};

	private getAll = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/resident-suggestions/apartment",
			schema: {
				tags: ["Resident Suggestions"],
				summary: "Get all resident suggestions by apartment and season",
				description: "Lista todas as sugestões do apartamento do morador",
				...this.residentSuggestionSchema.getAll,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler:
				this.residentSuggestionController.getAllSuggestionsByApartmentAndSeason.bind(
					this.residentSuggestionController,
				) as RouteHandlerMethod,
		};
	};

	private getById = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/resident-suggestions/:id",
			schema: {
				tags: ["Resident Suggestions"],
				summary: "Get resident suggestion by ID",
				description: "Busca uma sugestão específica por ID",
				...this.residentSuggestionSchema.getById,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.residentSuggestionController.getSuggestionById.bind(
				this.residentSuggestionController,
			) as RouteHandlerMethod,
		};
	};

	private update = (): RouteOptions => {
		return {
			method: "PUT",
			url: "/v1/resident-suggestions/:id",
			schema: {
				tags: ["Resident Suggestions"],
				summary: "Update resident suggestion",
				description: "Atualiza uma sugestão existente",
				...this.residentSuggestionSchema.update,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "update"),
			],
			handler: this.residentSuggestionController.updateSuggestion.bind(
				this.residentSuggestionController,
			) as RouteHandlerMethod,
		};
	};

	private delete = (): RouteOptions => {
		return {
			method: "DELETE",
			url: "/v1/resident-suggestions/:id",
			schema: {
				tags: ["Resident Suggestions"],
				summary: "Delete resident suggestion",
				description: "Deleta uma sugestão existente",
				...this.residentSuggestionSchema.delete,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "delete"),
			],
			handler: this.residentSuggestionController.deleteSuggestion.bind(
				this.residentSuggestionController,
			) as RouteHandlerMethod,
		};
	};

	public routes = (): RouteOptions[] => {
		return [
			this.create(),
			this.getAll(),
			this.getById(),
			this.update(),
			this.delete(),
		];
	};
}
