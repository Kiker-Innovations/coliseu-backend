import type { FastifyRequest, FastifyReply } from "fastify";
import type { MongoClient } from "mongodb";
import { AmenityBookingService } from "./amenity_booking.service";
import type {
	AmenityBookingCreateDto,
	AmenityBookingListQueryDto,
} from "./dto";
import { transformCreateAmenityBookingDto, transformAmenityBookingListQueryDto } from "./dto";
import httpStatus from "http-status";

export class AmenityBookingController {
	private amenityBookingService: AmenityBookingService;

	constructor(mongoClient: MongoClient) {
		this.amenityBookingService = new AmenityBookingService(mongoClient);
	}

	public async createAmenityBooking(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		try {
			const body = request.body as AmenityBookingCreateDto;
			const amenityBookingCreateDto = transformCreateAmenityBookingDto(body);

			const apartmentId = request.user?.apartmentId;
			const residentId = request.user?.userId;

			if (!apartmentId) {
				return reply.status(httpStatus.BAD_REQUEST).send({
					success: false,
					message: "apartmentId não encontrado no token",
				});
			}

			const result = await this.amenityBookingService.createAmenityBooking(
				amenityBookingCreateDto,
				apartmentId,
				residentId,
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

	public async getAvailableTimeSlots(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		try {
			const params = request.params as { id?: string };
			const query = request.query as { date?: string };
			const amenityId = params?.id;

			if (!amenityId) {
				return reply.status(httpStatus.BAD_REQUEST).send({
					success: false,
					message: "ID da comodidade não fornecido",
				});
			}

			if (!query.date) {
				return reply.status(httpStatus.BAD_REQUEST).send({
					success: false,
					message: "Data não fornecida",
				});
			}

			const date = new Date(query.date);
			if (isNaN(date.getTime())) {
				return reply.status(httpStatus.BAD_REQUEST).send({
					success: false,
					message: "Data inválida",
				});
			}

			const result = await this.amenityBookingService.getAvailableTimeSlots(
				amenityId,
				date,
			);

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
				message: "Erro interno do servidor ao buscar horários disponíveis",
			});
		}
	}

	public async getAmenityBookings(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		try {
			const query = request.query as any;
			const amenityBookingListQueryDto = transformAmenityBookingListQueryDto(query);

			// apartmentId é obrigatório - vem do token JWT
			const apartmentId = request.user?.apartmentId;

			if (!apartmentId) {
				return reply.status(httpStatus.BAD_REQUEST).send({
					success: false,
					message: "apartmentId não encontrado no token",
				});
			}

			const result = await this.amenityBookingService.getAmenityBookings(
				amenityBookingListQueryDto,
				apartmentId,
			);

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

	public async cancelAmenityBooking(
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

			const result = await this.amenityBookingService.cancelAmenityBooking(bookingId);

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

	public async getAmenityBookingsByBuilding(
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

			const result = await this.amenityBookingService.getAmenityBookingsByBuilding(
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

