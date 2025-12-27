import type { MongoClient } from "mongodb";
import type {
	CreateAmenityBookingEntity,
	AmenityBookingEntity,
} from "../../../database/mongodb/entity/amenity_booking.entity";
import { AmenityBookingRepository } from "../../../database/mongodb/repositories/amenity_booking.repository";
import { AmenityRepository } from "../../../database/mongodb/repositories/amenity.repository";
import { ApartmentRepository } from "../../../database/mongodb/repositories/apartment.repository";
import { ResidentRepository } from "../../../database/mongodb/repositories/resident.repository";
import type { AmenityBookingCreateDto, AmenityBookingListQueryDto } from "./dto";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";
import { AmenityBookingStatusEnum } from "../../enum/amenityBookingStatus.enum";

export class AmenityBookingService {
	private amenityBookingRepository: AmenityBookingRepository;
	private amenityRepository: AmenityRepository;
	private apartmentRepository: ApartmentRepository;
	private residentRepository: ResidentRepository;

	constructor(mongoClient: MongoClient) {
		this.amenityBookingRepository = new AmenityBookingRepository(mongoClient);
		this.amenityRepository = new AmenityRepository(mongoClient);
		this.apartmentRepository = new ApartmentRepository(mongoClient);
		this.residentRepository = new ResidentRepository(mongoClient);
	}

	public async createAmenityBooking(
		amenityBookingCreateDto: AmenityBookingCreateDto,
		apartmentId: string,
	): Promise<HttpResponse<AmenityBookingEntity>> {
		// Verificar se a comodidade existe
		const amenity = await this.amenityRepository.findById(amenityBookingCreateDto.amenityId);

		if (!amenity) {
			throw httpException("Comodidade não encontrada", httpStatus.NOT_FOUND);
		}

		// Verificar conflitos de data
		const conflictingBookings = await this.amenityBookingRepository.findConflictingBookings(
			amenityBookingCreateDto.amenityId,
			amenityBookingCreateDto.startDate,
			amenityBookingCreateDto.endDate,
		);

		if (conflictingBookings.length > 0) {
			throw httpException(
				"Já existe um agendamento neste período",
				httpStatus.CONFLICT,
			);
		}

		const amenityBookingEntity: CreateAmenityBookingEntity = {
			amenityId: amenityBookingCreateDto.amenityId,
			apartmentId,
			startDate: amenityBookingCreateDto.startDate,
			endDate: amenityBookingCreateDto.endDate,
			status: AmenityBookingStatusEnum.PENDENTE,
			totalValue: amenityBookingCreateDto.totalValue,
		};

		const createdBooking = await this.amenityBookingRepository.create(amenityBookingEntity);

		return {
			success: true,
			message: "Agendamento criado com sucesso! Aguardando confirmação.",
			data: createdBooking,
		};
	}

	public async getAmenityBookings(
		query: AmenityBookingListQueryDto,
		apartmentId: string,
	): Promise<HttpResponse<{ bookings: any[]; total: number; page: number; limit: number }>> {
		// Filtrar apenas por apartmentId (obrigatório)
		const filters: any = {
			apartmentId,
		};

		// Buscar bookings com paginação no banco
		const { bookings, total } = await this.amenityBookingRepository.listWithFilters(
			filters,
			query.page,
			query.limit,
		);

		// Buscar dados das amenities para cada booking e serializar corretamente
		const bookingsWithAmenity = await Promise.all(
			bookings.map(async (booking) => {
				if (!booking) {
					return null;
				}

				// Garantir que o booking tenha todos os campos necessários
				const bookingData = {
					_id: booking._id || "",
					amenityId: booking.amenityId || "",
					apartmentId: booking.apartmentId || "",
					startDate: booking.startDate || null,
					endDate: booking.endDate || null,
					status: booking.status || "",
					totalValue: booking.totalValue || 0,
					createdAt: booking.createdAt || null,
					updatedAt: booking.updatedAt || null,
				};

				const amenity = await this.amenityRepository.findById(bookingData.amenityId);
				
				// Serializar o booking para garantir que todos os campos sejam retornados
				const serializedBooking: any = {
					_id: String(bookingData._id),
					amenityId: String(bookingData.amenityId),
					apartmentId: String(bookingData.apartmentId),
					status: String(bookingData.status),
					totalValue: Number(bookingData.totalValue),
				};

				// Converter datas para ISO string
				if (bookingData.startDate) {
					serializedBooking.startDate = bookingData.startDate instanceof Date 
						? bookingData.startDate.toISOString() 
						: new Date(bookingData.startDate).toISOString();
				}

				if (bookingData.endDate) {
					serializedBooking.endDate = bookingData.endDate instanceof Date 
						? bookingData.endDate.toISOString() 
						: new Date(bookingData.endDate).toISOString();
				}

				if (bookingData.createdAt) {
					serializedBooking.createdAt = bookingData.createdAt instanceof Date 
						? bookingData.createdAt.toISOString() 
						: new Date(bookingData.createdAt).toISOString();
				}

				if (bookingData.updatedAt) {
					serializedBooking.updatedAt = bookingData.updatedAt instanceof Date 
						? bookingData.updatedAt.toISOString() 
						: new Date(bookingData.updatedAt).toISOString();
				}

				// Adicionar dados da amenity
				if (amenity) {
					serializedBooking.amenity = {
						name: amenity.name,
						description: amenity.description || null,
						type: amenity.type || null,
						value: amenity.value || null,
						fineValue: amenity.fineValue || null,
						maxResidents: amenity.maxResidents || null,
						bookingType: amenity.bookingType || null,
						maxHours: amenity.maxHours || null,
					};
				} else {
					serializedBooking.amenity = null;
				}
				
				return serializedBooking;
			}),
		);

		// Filtrar nulls caso existam
		const validBookings = bookingsWithAmenity.filter((booking) => booking !== null) as any[];

		return {
			success: true,
			message: "Agendamentos encontrados",
			data: {
				bookings: validBookings,
				total,
				page: query.page,
				limit: query.limit,
			},
		};
	}

	public async cancelAmenityBooking(
		bookingId: string,
	): Promise<HttpResponse<AmenityBookingEntity>> {
		const booking = await this.amenityBookingRepository.findById(bookingId);

		if (!booking) {
			throw httpException("Agendamento não encontrado", httpStatus.NOT_FOUND);
		}

		if (booking.status === AmenityBookingStatusEnum.CANCELADO) {
			throw httpException("Agendamento já está cancelado", httpStatus.BAD_REQUEST);
		}

		const updatedBooking = await this.amenityBookingRepository.update(bookingId, {
			status: AmenityBookingStatusEnum.CANCELADO,
		});

		if (!updatedBooking) {
			throw httpException("Erro ao cancelar agendamento", httpStatus.INTERNAL_SERVER_ERROR);
		}

		return {
			success: true,
			message: "Agendamento cancelado com sucesso",
			data: updatedBooking,
		};
	}

	public async getAmenityBookingsByBuilding(
		buildingId: string,
	): Promise<HttpResponse<{ bookings: any[]; total: number }>> {
		if (!buildingId) {
			throw httpException(
				"ID do edifício é obrigatório",
				httpStatus.BAD_REQUEST,
			);
		}

		// Buscar todas as amenities do building
		const amenities = await this.amenityRepository.findMany({ buildingId });
		const amenityIds = amenities.map((a) => a._id);

		if (amenityIds.length === 0) {
			return {
				success: true,
				message: "Nenhum agendamento encontrado",
				data: {
					bookings: [],
					total: 0,
				},
			};
		}

		// Filtrar agendamentos excluindo FINALIZADO e CANCELADO
		const filters: any = {
			amenityId: { $in: amenityIds },
			status: {
				$nin: [AmenityBookingStatusEnum.FINALIZADO, AmenityBookingStatusEnum.CANCELADO],
			},
		};

		// Buscar bookings
		const { bookings, total } = await this.amenityBookingRepository.listWithFilters(
			filters,
		);

		// Buscar dados completos (amenity, apartment, resident) para cada booking
		const bookingsWithDetails = await Promise.all(
			bookings.map(async (booking) => {
				if (!booking) {
					return null;
				}

				const amenity = await this.amenityRepository.findById(booking.amenityId);
				const apartment = await this.apartmentRepository.findById(booking.apartmentId);
				
				// Buscar resident do apartment
				let resident = null;
				if (apartment) {
					const residents = await this.residentRepository.findMany({
						apartmentId: apartment._id,
					});
					// Pegar o primeiro resident ativo ou o primeiro disponível
					resident = residents.find((r) => r.status === "ATIVO") || residents[0] || null;
				}

				// Serializar o booking
				const serializedBooking: any = {
					_id: String(booking._id),
					amenityId: String(booking.amenityId),
					apartmentId: String(booking.apartmentId),
					status: String(booking.status),
					totalValue: Number(booking.totalValue),
				};

				// Converter datas para ISO string
				if (booking.startDate) {
					serializedBooking.startDate = booking.startDate instanceof Date 
						? booking.startDate.toISOString() 
						: new Date(booking.startDate).toISOString();
				}

				if (booking.endDate) {
					serializedBooking.endDate = booking.endDate instanceof Date 
						? booking.endDate.toISOString() 
						: new Date(booking.endDate).toISOString();
				}

				if (booking.createdAt) {
					serializedBooking.createdAt = booking.createdAt instanceof Date 
						? booking.createdAt.toISOString() 
						: new Date(booking.createdAt).toISOString();
				}

				if (booking.updatedAt) {
					serializedBooking.updatedAt = booking.updatedAt instanceof Date 
						? booking.updatedAt.toISOString() 
						: new Date(booking.updatedAt).toISOString();
				}

				// Adicionar dados da amenity
				serializedBooking.amenity = amenity ? {
					_id: String(amenity._id),
					name: amenity.name,
					description: amenity.description || null,
					type: amenity.type || null,
				} : null;

				// Adicionar dados do apartment
				serializedBooking.apartment = apartment ? {
					_id: String(apartment._id),
					number: apartment.number,
					floor: apartment.floor || null,
					block: apartment.block || null,
				} : null;

				// Adicionar dados do resident
				serializedBooking.resident = resident ? {
					_id: String(resident._id),
					name: resident.name,
					email: resident.email,
				} : null;

				return serializedBooking;
			}),
		);

		// Filtrar nulls
		const validBookings = bookingsWithDetails.filter((booking) => booking !== null) as any[];

		return {
			success: true,
			message: "Agendamentos encontrados",
			data: {
				bookings: validBookings,
				total,
			},
		};
	}
}

