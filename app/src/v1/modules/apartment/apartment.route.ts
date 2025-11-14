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

	private getAll = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/apartments",
			schema: {
				tags: ["Apartments"],
				summary: "Get all apartments",
				description: "Lista todos os apartamentos cadastrados",
				...this.apartmentSchema.getAll,
			},
			handler: this.apartmentController.getAllApartments.bind(
				this.apartmentController,
			) as RouteHandlerMethod,
		};
	};

	public routes = (): RouteOptions[] => {
		return [this.getAll()];
	};
}

