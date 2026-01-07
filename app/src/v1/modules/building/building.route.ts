import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { BuildingController } from "./building.controller";
import { BuildingSchema } from "./building.schema";
import { AuthMiddleware } from "../auth/auth.middleware";

const MODULE_TAG = "building";

export class BuildingRouteV1 {
	private buildingController: BuildingController;
	private buildingSchema: BuildingSchema;
	private authMiddleware: AuthMiddleware;

	constructor(mongoClient: MongoClient) {
		this.buildingController = new BuildingController(mongoClient);
		this.buildingSchema = new BuildingSchema();
		this.authMiddleware = new AuthMiddleware(mongoClient);
	}

	private getById = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/buildings/:id",
			schema: {
				tags: ["Buildings"],
				summary: "Get building by ID",
				description: "Busca um edifício específico por ID",
				...this.buildingSchema.getById,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.buildingController.getBuilding.bind(
				this.buildingController,
			) as RouteHandlerMethod,
		};
	};

	private getAll = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/buildings",
			schema: {
				tags: ["Buildings"],
				summary: "Get all buildings",
				description: "Lista todos os edifícios cadastrados",
				...this.buildingSchema.getAll,
			},
			handler: this.buildingController.getAllBuildings.bind(
				this.buildingController,
			) as RouteHandlerMethod,
		};
	};

	public routes = (): RouteOptions[] => {
		return [this.getById(), this.getAll()];
	};
}
