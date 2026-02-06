import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { BookingController } from "./booking.controller";
import { BookingSchema } from "./booking.schema";
import { AuthMiddleware } from "../auth/auth.middleware";

const MODULE_TAG = "booking";

export class BookingRouteV1 {
	private bookingController: BookingController;
	private bookingSchema: BookingSchema;
	private authMiddleware: AuthMiddleware;

	constructor(mongoClient: MongoClient) {
		this.bookingController = new BookingController(mongoClient);
		this.bookingSchema = new BookingSchema();
		this.authMiddleware = new AuthMiddleware(mongoClient);
	}

	private create = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/bookings",
			schema: {
				tags: ["Bookings"],
				summary: "Create a new booking",
				description: "Cria uma nova reserva de comodidade",
				...this.bookingSchema.create,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "create"),
			],
			handler: this.bookingController.createBooking.bind(
				this.bookingController,
			) as RouteHandlerMethod,
		};
	};

	private list = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/bookings",
			schema: {
				tags: ["Bookings"],
				summary: "List bookings",
				description: "Lista reservas de comodidades com filtros opcionais",
				...this.bookingSchema.list,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.bookingController.getBookings.bind(
				this.bookingController,
			) as RouteHandlerMethod,
		};
	};

	private cancel = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/bookings/:id/cancel",
			schema: {
				tags: ["Bookings"],
				summary: "Cancel booking",
				description: "Cancela uma reserva de comodidade",
				...this.bookingSchema.cancel,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "update"),
			],
			handler: this.bookingController.cancelBooking.bind(
				this.bookingController,
			) as RouteHandlerMethod,
		};
	};

	private listByBuilding = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/bookings/admin/building",
			schema: {
				tags: ["Bookings"],
				summary: "List bookings by building (Admin)",
				description:
					"Lista todas as reservas de comodidades do edifício (exclui FINALIZADO e CANCELADO)",
				...this.bookingSchema.listByBuilding,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.bookingController.getBookingsByBuilding.bind(
				this.bookingController,
			) as RouteHandlerMethod,
		};
	};

	private availability = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/bookings/availability",
			schema: {
				tags: ["Bookings"],
				summary: "Get booking availability",
				description:
					"Retorna a disponibilidade de dias para uma comodidade em um período específico. Considera apenas bookings com status PENDENTE, AGENDADO ou EM_ANDAMENTO.",
				...this.bookingSchema.availability,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.bookingController.getAvailability.bind(
				this.bookingController,
			) as RouteHandlerMethod,
		};
	};

	private hoursAvailability = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/bookings/availability/hours",
			schema: {
				tags: ["Bookings"],
				summary: "Get booking hours availability",
				description:
					"Retorna a disponibilidade de horas (0-23) para uma comodidade em um dia específico. Considera apenas bookings com status PENDENTE, AGENDADO ou EM_ANDAMENTO.",
				...this.bookingSchema.hoursAvailability,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.bookingController.getHoursAvailability.bind(
				this.bookingController,
			) as RouteHandlerMethod,
		};
	};

	public routes = (): RouteOptions[] => {
		return [
			this.create(),
			this.list(),
			this.cancel(),
			this.listByBuilding(),
			this.availability(),
			this.hoursAvailability(),
		];
	};
}
