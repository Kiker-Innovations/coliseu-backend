import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { ProjectSuggestionController } from "./projectSuggestion.controller";
import { ProjectSuggestionSchema } from "./projectSuggestion.schema";
import { AuthMiddleware } from "../auth/auth.middleware";

const MODULE_TAG = "project-suggestion";

export class ProjectSuggestionRouteV1 {
	private projectSuggestionController: ProjectSuggestionController;
	private projectSuggestionSchema: ProjectSuggestionSchema;
	private authMiddleware: AuthMiddleware;

	constructor(mongoClient: MongoClient) {
		this.projectSuggestionController = new ProjectSuggestionController(
			mongoClient,
		);
		this.projectSuggestionSchema = new ProjectSuggestionSchema();
		this.authMiddleware = new AuthMiddleware(mongoClient);
	}

	private rankSuggestions = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/seasons/:seasonId/rank-suggestions",
			schema: {
				tags: ["ProjectSuggestions"],
				summary: "Rank suggestions from a season",
				description:
					"Processa e rankeia as sugestões dos moradores de uma season. Remove duplicatas e organiza por relevância. Deve ser chamado pelo administrador após o período de captação de sugestões",
				...this.projectSuggestionSchema.rankSuggestions,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "create"),
			],
			handler: this.projectSuggestionController.rankSuggestions.bind(
				this.projectSuggestionController,
			) as RouteHandlerMethod,
		};
	};

	private getBySeasonId = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/seasons/:seasonId/project-suggestions",
			schema: {
				tags: ["ProjectSuggestions"],
				summary: "Get project suggestions by season",
				description: "Lista todas as sugestões rankeadas de uma season",
				...this.projectSuggestionSchema.getBySeasonId,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.projectSuggestionController.getBySeasonId.bind(
				this.projectSuggestionController,
			) as RouteHandlerMethod,
		};
	};

	private startVoting = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/seasons/:seasonId/project-suggestions/start-voting",
			schema: {
				tags: ["ProjectSuggestions"],
				summary: "Start voting period",
				description:
					"Inicia o período de votação para as sugestões rankeadas de uma season. Define as datas de início e fim da votação",
				...this.projectSuggestionSchema.startVoting,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "update"),
			],
			handler: this.projectSuggestionController.startVoting.bind(
				this.projectSuggestionController,
			) as RouteHandlerMethod,
		};
	};

	private endVoting = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/seasons/:seasonId/project-suggestions/end-voting",
			schema: {
				tags: ["ProjectSuggestions"],
				summary: "End voting period",
				description:
					"Encerra o período de votação e recalcula o ranking baseado nos votos recebidos",
				...this.projectSuggestionSchema.endVoting,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "update"),
			],
			handler: this.projectSuggestionController.endVoting.bind(
				this.projectSuggestionController,
			) as RouteHandlerMethod,
		};
	};

	private vote = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/project-suggestions/vote",
			schema: {
				tags: ["ProjectSuggestions"],
				summary: "Vote for a project suggestion",
				description:
					"Registra ou atualiza os votos de um morador em uma sugestão. Cada morador possui 3 votos por season que podem ser distribuídos livremente entre as sugestões",
				...this.projectSuggestionSchema.vote,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "create"),
			],
			handler: this.projectSuggestionController.vote.bind(
				this.projectSuggestionController,
			) as RouteHandlerMethod,
		};
	};

	private deleteVote = (): RouteOptions => {
		return {
			method: "DELETE",
			url: "/v1/project-suggestions/:projectSuggestionId/vote",
			schema: {
				tags: ["ProjectSuggestions"],
				summary: "Delete vote from a project suggestion",
				description: "Remove os votos de um morador em uma sugestão específica",
				...this.projectSuggestionSchema.deleteVote,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "delete"),
			],
			handler: this.projectSuggestionController.deleteVote.bind(
				this.projectSuggestionController,
			) as RouteHandlerMethod,
		};
	};

	private getMyVotes = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/seasons/:seasonId/project-suggestions/my-votes",
			schema: {
				tags: ["ProjectSuggestions"],
				summary: "Get my votes in a season",
				description:
					"Retorna os votos do morador autenticado em todas as sugestões de uma season",
				...this.projectSuggestionSchema.getMyVotes,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.projectSuggestionController.getMyVotes.bind(
				this.projectSuggestionController,
			) as RouteHandlerMethod,
		};
	};

	private createProjectsFromTopSuggestions = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/seasons/:seasonId/project-suggestions/create-projects",
			schema: {
				tags: ["ProjectSuggestions"],
				summary: "Create projects from top voted suggestions",
				description:
					"Cria projetos a partir das sugestões mais votadas de uma season. O administrador define quantos projetos serão criados (default: 3)",
				...this.projectSuggestionSchema.createProjectsFromTopSuggestions,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "create"),
			],
			handler:
				this.projectSuggestionController.createProjectsFromTopSuggestions.bind(
					this.projectSuggestionController,
				) as RouteHandlerMethod,
		};
	};

	public routes = (): RouteOptions[] => {
		return [
			this.rankSuggestions(),
			this.getBySeasonId(),
			this.startVoting(),
			this.endVoting(),
			this.vote(),
			this.deleteVote(),
			this.getMyVotes(),
			this.createProjectsFromTopSuggestions(),
		];
	};
}
