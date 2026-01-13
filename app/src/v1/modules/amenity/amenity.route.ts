import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { AmenityController } from "./amenity.controller";
import { AmenitySchema } from "./amenity.schema";
import { AuthMiddleware } from "../auth/auth.middleware";

const MODULE_TAG = "amenity";

export class AmenityRouteV1 {
	private amenityController: AmenityController;
	private amenitySchema: AmenitySchema;
	private authMiddleware: AuthMiddleware;

	constructor(mongoClient: MongoClient) {
		this.amenityController = new AmenityController(mongoClient);
		this.amenitySchema = new AmenitySchema();
		this.authMiddleware = new AuthMiddleware(mongoClient);
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
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "create"),
			],
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
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
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
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
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
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "update"),
			],
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
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "delete"),
			],
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
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
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
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
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
