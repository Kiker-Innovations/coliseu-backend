import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { BuildingController } from "./building.controller";
import { BuildingSchema } from "./building.schema";

export class BuildingRouteV1 {
	private buildingController: BuildingController;
	private buildingSchema: BuildingSchema;

	constructor(mongoClient: MongoClient) {
		this.buildingController = new BuildingController(mongoClient);
		this.buildingSchema = new BuildingSchema();
	}

	private create = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/buildings",
			schema: {
				tags: ["Buildings"],
				summary: "Create a new building",
				description: "Cria um novo edifício no sistema",
				...this.buildingSchema.create,
			},
			handler: this.buildingController.createBuilding.bind(
				this.buildingController,
			) as RouteHandlerMethod,
		};
	};

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

	private update = (): RouteOptions => {
		return {
			method: "PUT",
			url: "/v1/buildings/:id",
			schema: {
				tags: ["Buildings"],
				summary: "Update building",
				description: "Atualiza dados de um edifício",
				...this.buildingSchema.update,
			},
			handler: this.buildingController.updateBuilding.bind(
				this.buildingController,
			) as RouteHandlerMethod,
		};
	};

	private remove = (): RouteOptions => {
		return {
			method: "DELETE",
			url: "/v1/buildings/:id",
			schema: {
				tags: ["Buildings"],
				summary: "Delete building",
				description: "Remove um edifício do sistema",
				...this.buildingSchema.remove,
			},
			handler: this.buildingController.deleteBuilding.bind(
				this.buildingController,
			) as RouteHandlerMethod,
		};
	};

	public routes = (): RouteOptions[] => {
		return [
			this.create(),
			this.getById(),
			this.getAll(),
			this.update(),
			this.remove(),
		];
	};
}
