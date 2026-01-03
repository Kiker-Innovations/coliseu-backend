import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { ApartmentController } from "./apartment.controller";
import { ApartmentSchema } from "./apartment.schema";

export class ApartmentRouteV1 {
	private apartmentController: ApartmentController;
	private apartmentSchema: ApartmentSchema;

	constructor(mongoClient: MongoClient) {
		this.apartmentController = new ApartmentController(mongoClient);
		this.apartmentSchema = new ApartmentSchema();
	}

	private create = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/apartments",
			schema: {
				tags: ["Apartments"],
				summary: "Create a new apartment",
				description: "Cria um novo apartamento no sistema",
				...this.apartmentSchema.create,
			},
			handler: this.apartmentController.createApartment.bind(
				this.apartmentController,
			) as RouteHandlerMethod,
		};
	};

	private getById = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/apartments/:id",
			schema: {
				tags: ["Apartments"],
				summary: "Get apartment by ID",
				description: "Busca um apartamento específico por ID",
				...this.apartmentSchema.getById,
			},
			handler: this.apartmentController.getApartment.bind(
				this.apartmentController,
			) as RouteHandlerMethod,
		};
	};

	private getAllByBuilding = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/apartments",
			schema: {
				tags: ["Apartments"],
				summary: "Get all apartments by building",
				description: "Lista todos os apartamentos de um edifício específico",
				...this.apartmentSchema.getAllByBuilding,
			},
			handler: this.apartmentController.getAllApartmentsByBuilding.bind(
				this.apartmentController,
			) as RouteHandlerMethod,
		};
	};

	private update = (): RouteOptions => {
		return {
			method: "PUT",
			url: "/v1/apartments/:id",
			schema: {
				tags: ["Apartments"],
				summary: "Update apartment",
				description: "Atualiza dados de um apartamento",
				...this.apartmentSchema.update,
			},
			handler: this.apartmentController.updateApartment.bind(
				this.apartmentController,
			) as RouteHandlerMethod,
		};
	};

	private remove = (): RouteOptions => {
		return {
			method: "DELETE",
			url: "/v1/apartments/:id",
			schema: {
				tags: ["Apartments"],
				summary: "Delete apartment",
				description: "Remove um apartamento do sistema",
				...this.apartmentSchema.remove,
			},
			handler: this.apartmentController.deleteApartment.bind(
				this.apartmentController,
			) as RouteHandlerMethod,
		};
	};

	public routes = (): RouteOptions[] => {
		return [
			this.create(),
			this.getById(),
			this.getAllByBuilding(),
			this.update(),
			this.remove(),
		];
	};
}

