import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { SuggestionController } from "./suggestion.controller";
import { SuggestionSchema } from "./suggestion.schema";

export class SuggestionRouteV1 {
	private suggestionController: SuggestionController;
	private suggestionSchema: SuggestionSchema;

	constructor(mongoClient: MongoClient) {
		this.suggestionController = new SuggestionController(mongoClient);
		this.suggestionSchema = new SuggestionSchema();
	}

	private create = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/suggestions",
			schema: {
				tags: ["Suggestions"],
				summary: "Create a new suggestion",
				description: "Cria uma nova sugestão para o apartamento do morador",
				...this.suggestionSchema.create,
			},
			handler: this.suggestionController.createSuggestion.bind(
				this.suggestionController,
			) as RouteHandlerMethod,
		};
	};

	private getAllByApartment = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/suggestions/apartment",
			schema: {
				tags: ["Suggestions"],
				summary: "Get all suggestions by apartment",
				description: "Lista todas as sugestões do apartamento do morador",
				...this.suggestionSchema.getAllByApartment,
			},
			handler: this.suggestionController.getAllSuggestionsByApartment.bind(
				this.suggestionController,
			) as RouteHandlerMethod,
		};
	};

	private getById = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/suggestions/:id",
			schema: {
				tags: ["Suggestions"],
				summary: "Get suggestion by ID",
				description: "Busca uma sugestão específica por ID",
				...this.suggestionSchema.getById,
			},
			handler: this.suggestionController.getSuggestionById.bind(
				this.suggestionController,
			) as RouteHandlerMethod,
		};
	};

	private update = (): RouteOptions => {
		return {
			method: "PUT",
			url: "/v1/suggestions/:id",
			schema: {
				tags: ["Suggestions"],
				summary: "Update suggestion",
				description: "Atualiza uma sugestão existente",
				...this.suggestionSchema.update,
			},
			handler: this.suggestionController.updateSuggestion.bind(
				this.suggestionController,
			) as RouteHandlerMethod,
		};
	};

	private delete = (): RouteOptions => {
		return {
			method: "DELETE",
			url: "/v1/suggestions/:id",
			schema: {
				tags: ["Suggestions"],
				summary: "Delete suggestion",
				description: "Deleta uma sugestão existente",
				...this.suggestionSchema.delete,
			},
			handler: this.suggestionController.deleteSuggestion.bind(
				this.suggestionController,
			) as RouteHandlerMethod,
		};
	};

	private getAll = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/suggestions",
			schema: {
				tags: ["Suggestions"],
				summary: "Get all suggestions (Admin only)",
				description:
					"Lista todas as sugestões de todos os apartamentos (apenas administradores)",
				...this.suggestionSchema.getAll,
			},
			handler: this.suggestionController.getAllSuggestions.bind(
				this.suggestionController,
			) as RouteHandlerMethod,
		};
	};

	public routes = (): RouteOptions[] => {
		return [
			this.create(),
			this.getAllByApartment(),
			this.getAll(),
			this.getById(),
			this.update(),
			this.delete(),
		];
	};
}

