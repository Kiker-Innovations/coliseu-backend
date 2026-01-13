import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { SeasonController } from "./season.controller";
import { SeasonSchema } from "./season.schema";
import { AuthMiddleware } from "../auth/auth.middleware";

const MODULE_TAG = "season";

export class SeasonRouteV1 {
	private seasonController: SeasonController;
	private seasonSchema: SeasonSchema;
	private authMiddleware: AuthMiddleware;

	constructor(mongoClient: MongoClient) {
		this.seasonController = new SeasonController(mongoClient);
		this.seasonSchema = new SeasonSchema();
		this.authMiddleware = new AuthMiddleware(mongoClient);
	}

	private create = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/seasons",
			schema: {
				tags: ["Seasons"],
				summary: "Create a new season",
				description: "Cria uma nova season para o prédio do administrador",
				...this.seasonSchema.create,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "create"),
			],
			handler: this.seasonController.createSeason.bind(
				this.seasonController,
			) as RouteHandlerMethod,
		};
	};

	private getAllByBuilding = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/seasons",
			schema: {
				tags: ["Seasons"],
				summary: "Get all seasons by building",
				description: "Lista todas as seasons do prédio do administrador",
				...this.seasonSchema.getAllByBuilding,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.seasonController.getAllSeasonsByBuilding.bind(
				this.seasonController,
			) as RouteHandlerMethod,
		};
	};

	private getById = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/seasons/:id",
			schema: {
				tags: ["Seasons"],
				summary: "Get season by ID",
				description: "Busca uma season específica por ID",
				...this.seasonSchema.getById,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.seasonController.getSeasonById.bind(
				this.seasonController,
			) as RouteHandlerMethod,
		};
	};

	private update = (): RouteOptions => {
		return {
			method: "PUT",
			url: "/v1/seasons/:id",
			schema: {
				tags: ["Seasons"],
				summary: "Update season",
				description: "Atualiza uma season existente",
				...this.seasonSchema.update,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "update"),
			],
			handler: this.seasonController.updateSeason.bind(
				this.seasonController,
			) as RouteHandlerMethod,
		};
	};

	private finish = (): RouteOptions => {
		return {
			method: "PATCH",
			url: "/v1/seasons/:id/finish",
			schema: {
				tags: ["Seasons"],
				summary: "Finish season",
				description: "Finaliza uma season, definindo o endDate",
				...this.seasonSchema.finish,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "update"),
			],
			handler: this.seasonController.finishSeason.bind(
				this.seasonController,
			) as RouteHandlerMethod,
		};
	};

	private delete = (): RouteOptions => {
		return {
			method: "DELETE",
			url: "/v1/seasons/:id",
			schema: {
				tags: ["Seasons"],
				summary: "Delete season",
				description: "Deleta uma season existente",
				...this.seasonSchema.delete,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "delete"),
			],
			handler: this.seasonController.deleteSeason.bind(
				this.seasonController,
			) as RouteHandlerMethod,
		};
	};

	public routes = (): RouteOptions[] => {
		return [
			this.create(),
			this.getAllByBuilding(),
			this.getById(),
			this.update(),
			this.finish(),
			this.delete(),
		];
	};
}
