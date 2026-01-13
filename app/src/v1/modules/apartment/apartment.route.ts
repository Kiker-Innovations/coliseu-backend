import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { ApartmentController } from "./apartment.controller";
import { ApartmentSchema } from "./apartment.schema";
import { AuthMiddleware } from "../auth/auth.middleware";

const MODULE_TAG = "apartment";

export class ApartmentRouteV1 {
	private apartmentController: ApartmentController;
	private apartmentSchema: ApartmentSchema;
	private authMiddleware: AuthMiddleware;

	constructor(mongoClient: MongoClient) {
		this.apartmentController = new ApartmentController(mongoClient);
		this.apartmentSchema = new ApartmentSchema();
		this.authMiddleware = new AuthMiddleware(mongoClient);
	}

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
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
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
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.apartmentController.getAllApartmentsByBuilding.bind(
				this.apartmentController,
			) as RouteHandlerMethod,
		};
	};

	public routes = (): RouteOptions[] => {
		return [this.getById(), this.getAllByBuilding()];
	};
}
