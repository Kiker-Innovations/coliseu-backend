import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { AmenityBookingController } from "./amenity_booking.controller";
import { AmenityBookingSchema } from "./amenity_booking.schema";
import { AuthMiddleware } from "../auth/auth.middleware";

export class AmenityBookingRouteV1 {
	private amenityBookingController: AmenityBookingController;
	private amenityBookingSchema: AmenityBookingSchema;
	private authMiddleware: AuthMiddleware;

	constructor(mongoClient: MongoClient) {
		this.amenityBookingController = new AmenityBookingController(mongoClient);
		this.amenityBookingSchema = new AmenityBookingSchema();
		this.authMiddleware = new AuthMiddleware(mongoClient);
	}

	private create = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/amenity-bookings",
			schema: {
				tags: ["Amenity Bookings"],
				summary: "Create a new amenity booking",
				description: "Cria um novo agendamento de comodidade",
				...this.amenityBookingSchema.create,
			},
			preHandler: this.authMiddleware.authenticate,
			handler: this.amenityBookingController.createAmenityBooking.bind(
				this.amenityBookingController,
			) as RouteHandlerMethod,
		};
	};

	private list = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/amenity-bookings",
			schema: {
				tags: ["Amenity Bookings"],
				summary: "List amenity bookings",
				description: "Lista agendamentos de comodidades com filtros opcionais",
				...this.amenityBookingSchema.list,
			},
			preHandler: this.authMiddleware.authenticate,
			handler: this.amenityBookingController.getAmenityBookings.bind(
				this.amenityBookingController,
			) as RouteHandlerMethod,
		};
	};

	private cancel = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/amenity-bookings/:id/cancel",
			schema: {
				tags: ["Amenity Bookings"],
				summary: "Cancel amenity booking",
				description: "Cancela um agendamento de comodidade",
				...this.amenityBookingSchema.cancel,
			},
			preHandler: this.authMiddleware.authenticate,
			handler: this.amenityBookingController.cancelAmenityBooking.bind(
				this.amenityBookingController,
			) as RouteHandlerMethod,
		};
	};

	private listByBuilding = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/amenity-bookings/admin/building",
			schema: {
				tags: ["Amenity Bookings"],
				summary: "List amenity bookings by building (Admin)",
				description: "Lista todos os agendamentos de comodidades do edifício (exclui FINALIZADO e CANCELADO)",
				...this.amenityBookingSchema.listByBuilding,
			},
			preHandler: this.authMiddleware.authenticate,
			handler: this.amenityBookingController.getAmenityBookingsByBuilding.bind(
				this.amenityBookingController,
			) as RouteHandlerMethod,
		};
	};

	public routes = (): RouteOptions[] => {
		return [
			this.create(),
			this.list(),
			this.cancel(),
			this.listByBuilding(),
		];
	};
}

