import type { FastifyRequest, FastifyReply } from "fastify";
import type { MongoClient } from "mongodb";
import { BookingService } from "./booking.service";
import type {
	BookingCreateDto,
	BookingListQueryDto,
} from "./dto";
import {
	transformCreateBookingDto,
	transformBookingListQueryDto,
} from "./dto";
import httpStatus from "http-status";

export class BookingController {
	private bookingService: BookingService;

	constructor(mongoClient: MongoClient) {
		this.bookingService = new BookingService(mongoClient);
	}

	public async createBooking(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		try {
			const body = request.body as BookingCreateDto;
			const bookingCreateDto = transformCreateBookingDto(body);

		const apartmentId = request.user?.apartmentId;
		const residentId = request.user?.userId;
		const buildingId = request.user?.buildingId;

		if (!apartmentId) {
			return reply.status(httpStatus.BAD_REQUEST).send({
				success: false,
				message: "apartmentId não encontrado no token",
			});
		}

		if (!buildingId) {
			return reply.status(httpStatus.BAD_REQUEST).send({
				success: false,
				message: "buildingId não encontrado no token",
			});
		}

		const result = await this.bookingService.createBooking(
			bookingCreateDto,
			apartmentId,
			residentId,
			buildingId,
		);

			return reply.status(httpStatus.CREATED).send(result);
		} catch (error: any) {
			if (error.statusCode) {
				return reply.status(error.statusCode).send({
					success: false,
					message: error.message,
				});
			}
			return reply.status(httpStatus.INTERNAL_SERVER_ERROR).send({
				success: false,
				message: "Erro interno do servidor ao criar reserva",
			});
		}
	}

	public async getBookings(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		try {
			const query = request.query as any;
			const bookingListQueryDto =
				transformBookingListQueryDto(query);

			// apartmentId é obrigatório - vem do token JWT
			const apartmentId = request.user?.apartmentId;

			if (!apartmentId) {
				return reply.status(httpStatus.BAD_REQUEST).send({
					success: false,
					message: "apartmentId não encontrado no token",
				});
			}

			const result = await this.bookingService.getBookings(
				bookingListQueryDto,
				apartmentId,
			);

			// Log para debug - verificar se paymentUrl está presente antes de enviar
			if (result.data?.bookings && result.data.bookings.length > 0) {
				const firstBooking = result.data.bookings[0];
				console.log(`Controller - Primeiro booking paymentUrl:`, firstBooking.paymentUrl);
				console.log(`Controller - Primeiro booking paymentId:`, firstBooking.paymentId);
			}

			return reply.status(httpStatus.OK).send(result);
		} catch (error: any) {
			if (error.statusCode) {
				return reply.status(error.statusCode).send({
					success: false,
					message: error.message,
				});
			}
			return reply.status(httpStatus.INTERNAL_SERVER_ERROR).send({
				success: false,
				message: "Erro interno do servidor ao buscar reservas",
			});
		}
	}

	public async cancelBooking(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		try {
			const params = request.params as { id?: string };
			const bookingId = params?.id;

			if (!bookingId) {
				return reply.status(httpStatus.BAD_REQUEST).send({
					success: false,
					message: "ID da reserva não fornecido",
				});
			}

			const result =
				await this.bookingService.cancelBooking(bookingId);

			return reply.status(httpStatus.OK).send(result);
		} catch (error: any) {
			if (error.statusCode) {
				return reply.status(error.statusCode).send({
					success: false,
					message: error.message,
				});
			}
			return reply.status(httpStatus.INTERNAL_SERVER_ERROR).send({
				success: false,
				message: "Erro interno do servidor ao cancelar reserva",
			});
		}
	}

	public async getBookingsByBuilding(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		try {
			const buildingId = request.user?.buildingId;

			if (!buildingId) {
				return reply.status(httpStatus.BAD_REQUEST).send({
					success: false,
					message: "ID do edifício não encontrado no token",
				});
			}

			const result =
				await this.bookingService.getBookingsByBuilding(
					buildingId,
				);

			return reply.status(httpStatus.OK).send(result);
		} catch (error: any) {
			if (error.statusCode) {
				return reply.status(error.statusCode).send({
					success: false,
					message: error.message,
				});
			}
			console.error("Erro ao buscar reservas por building:", error);
			return reply.status(httpStatus.INTERNAL_SERVER_ERROR).send({
				success: false,
				message: "Erro interno do servidor ao buscar reservas",
			});
		}
	}
}

