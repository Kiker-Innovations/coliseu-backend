import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { AmenityController } from "./amenity.controller";
import { AmenitySchema } from "./amenity.schema";

export class AmenityRouteV1 {
	private amenityController: AmenityController;
	private amenitySchema: AmenitySchema;

	constructor(mongoClient: MongoClient) {
		this.amenityController = new AmenityController(mongoClient);
		this.amenitySchema = new AmenitySchema();
	}

	private create = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/amenities",
			schema: {
				tags: ["Amenities"],
				summary: "Create a new amenity",
				description: "Cria uma nova comodidade no sistema",
				...this.amenitySchema.create,
			},
			handler: this.amenityController.createAmenity.bind(
				this.amenityController,
			) as RouteHandlerMethod,
		};
	};

	private getById = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/amenities/:id",
			schema: {
				tags: ["Amenities"],
				summary: "Get amenity by ID",
				description: "Busca uma comodidade específica por ID",
				...this.amenitySchema.getById,
			},
			handler: this.amenityController.getAmenity.bind(
				this.amenityController,
			) as RouteHandlerMethod,
		};
	};

	private getAllByBuilding = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/amenities",
			schema: {
				tags: ["Amenities"],
				summary: "Get all amenities by building",
				description: "Lista todas as comodidades de um edifício específico",
				...this.amenitySchema.getAllByBuilding,
			},
			handler: this.amenityController.getAllAmenitiesByBuilding.bind(
				this.amenityController,
			) as RouteHandlerMethod,
		};
	};

	private update = (): RouteOptions => {
		return {
			method: "PUT",
			url: "/v1/amenities/:id",
			schema: {
				tags: ["Amenities"],
				summary: "Update amenity",
				description: "Atualiza dados de uma comodidade",
				...this.amenitySchema.update,
			},
			handler: this.amenityController.updateAmenity.bind(
				this.amenityController,
			) as RouteHandlerMethod,
		};
	};

	private remove = (): RouteOptions => {
		return {
			method: "DELETE",
			url: "/v1/amenities/:id",
			schema: {
				tags: ["Amenities"],
				summary: "Delete amenity",
				description: "Remove uma comodidade do sistema",
				...this.amenitySchema.remove,
			},
			handler: this.amenityController.deleteAmenity.bind(
				this.amenityController,
			) as RouteHandlerMethod,
		};
	};

	private countByBuilding = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/amenities/count",
			schema: {
				tags: ["Amenities"],
				summary: "Count amenities by building",
				description: "Retorna a contagem de comodidades de um edifício",
				...this.amenitySchema.countByBuilding,
			},
			handler: this.amenityController.countAmenitiesByBuilding.bind(
				this.amenityController,
			) as RouteHandlerMethod,
		};
	};

	private getActiveCommoditiesForResident = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/amenities/resident/active",
			schema: {
				tags: ["Amenities"],
				summary: "Get active commodities for resident",
				description:
					"Lista todas as comodidades ativas do tipo COMODIDADE para residentes",
				...this.amenitySchema.getActiveCommoditiesForResident,
			},
			handler: this.amenityController.getActiveCommoditiesForResident.bind(
				this.amenityController,
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
			this.countByBuilding(),
			this.getActiveCommoditiesForResident(),
		];
	};
}
