import type { MongoClient } from "mongodb";
import type {
	CreateAmenityBookingEntity,
	AmenityBookingEntity,
} from "../../../database/mongodb/entity/amenityBooking.entity";
import { AmenityBookingRepository } from "../../../database/mongodb/repositories/amenity_booking.repository";
import { AmenityRepository } from "../../../database/mongodb/repositories/amenity.repository";
import { ApartmentRepository } from "../../../database/mongodb/repositories/apartment.repository";
import { ResidentRepository } from "../../../database/mongodb/repositories/resident.repository";
import type { AmenityBookingCreateDto, AmenityBookingListQueryDto } from "./dto";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";
import { AmenityBookingStatusEnum } from "../../enum/amenityBookingStatus.enum";
import { getDate } from "../../utils/utils";
import { randomUUID } from "node:crypto";

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

	/**
	 * Calcula o valor total da reserva baseado no tipo de reserva
	 */
	private calculateTotalValue(
		amenity: any,
		startDate: Date,
		endDate?: Date,
		startTime?: string,
		endTime?: string,
		numberOfHours?: number,
	): number {
		if (!amenity.value || amenity.value === 0) {
			return 0;
		}

		if (amenity.bookingType === "POR_HORAS") {
			// Calcular horas
			let hours = 0;
			if (numberOfHours) {
				hours = numberOfHours;
			} else if (startTime && endTime) {
				const [startHour, startMin] = startTime.split(":").map(Number);
				const [endHour, endMin] = endTime.split(":").map(Number);
				const startMinutes = startHour * 60 + startMin;
				const endMinutes = endHour * 60 + endMin;
				hours = Math.ceil((endMinutes - startMinutes) / 60);
			} else {
				hours = 1; // Default 1 hora
			}
			return amenity.value * hours;
		} else {
			// Calcular dias (DIARIO)
			if (!endDate) {
				return amenity.value; // 1 dia
			}
			const diffTime = endDate.getTime() - startDate.getTime();
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
			return amenity.value * Math.max(1, diffDays);
		}
	}

	/**
	 * Gera um QR code mockado para pagamento PIX
	 */
	private generateQRCode(bookingId: string, totalValue: number): string {
		// Mock QR code PIX - em produção, usar biblioteca como qrcode ou API de pagamento
		const qrData = {
			bookingId,
			value: totalValue,
			currency: "BRL",
			description: `Pagamento reserva ${bookingId}`,
			timestamp: new Date().toISOString(),
			type: "PIX",
		};
		// Retornar uma string base64 mockada simulando um QR code PIX
		// Em produção, isso seria gerado por uma biblioteca de QR code ou API de pagamento
		return `PIX_MOCK_${Buffer.from(JSON.stringify(qrData)).toString("base64")}`;
	}

	/**
	 * Lista horários disponíveis para uma comodidade em uma data específica
	 */
	public async getAvailableTimeSlots(
		amenityId: string,
		date: Date,
	): Promise<HttpResponse<{ availableSlots: string[]; bookedSlots: any[] }>> {
		const amenity = await this.amenityRepository.findById(amenityId);

		if (!amenity) {
			throw httpException("Comodidade não encontrada", httpStatus.NOT_FOUND);
		}

		if (amenity.bookingType !== "POR_HORAS") {
			throw httpException(
				"Esta comodidade não utiliza reserva por horas",
				httpStatus.BAD_REQUEST,
			);
		}

		// Buscar reservas existentes para a data
		const startOfDay = new Date(date);
		startOfDay.setHours(0, 0, 0, 0);
		const endOfDay = new Date(date);
		endOfDay.setHours(23, 59, 59, 999);

		const existingBookings = await this.amenityBookingRepository.findMany({
			amenityId,
			startDate: {
				$gte: startOfDay,
				$lte: endOfDay,
			},
			status: {
				$in: [AmenityBookingStatusEnum.PENDENTE, AmenityBookingStatusEnum.CONFIRMADO],
			},
		});

		// Gerar todos os horários possíveis (00:00 até 23:00)
		const allSlots: string[] = [];
		for (let hour = 0; hour < 24; hour++) {
			allSlots.push(`${hour.toString().padStart(2, "0")}:00`);
		}

		// Filtrar horários já agendados
		const bookedSlots: any[] = [];
		existingBookings.forEach((booking) => {
			if (booking.startTime && booking.endTime) {
				const [startHour] = booking.startTime.split(":").map(Number);
				const [endHour] = booking.endTime.split(":").map(Number);
				for (let hour = startHour; hour < endHour; hour++) {
					const slot = `${hour.toString().padStart(2, "0")}:00`;
					if (!bookedSlots.find((s) => s.time === slot)) {
						bookedSlots.push({
							time: slot,
							bookingId: booking._id,
						});
					}
				}
			}
		});

		// Filtrar horários disponíveis
		const availableSlots = allSlots.filter(
			(slot) => !bookedSlots.find((booked) => booked.time === slot),
		);

		// Se há maxHours, considerar apenas slots que permitam reserva completa
		if (amenity.maxHours) {
			const validSlots: string[] = [];
			availableSlots.forEach((slot) => {
				const [slotHour] = slot.split(":").map(Number);
				// Verificar se há slots consecutivos suficientes
				let consecutiveAvailable = 0;
				for (let i = 0; i < amenity.maxHours; i++) {
					const checkSlot = `${(slotHour + i).toString().padStart(2, "0")}:00`;
					if (availableSlots.includes(checkSlot)) {
						consecutiveAvailable++;
					}
				}
				if (consecutiveAvailable >= amenity.maxHours) {
					validSlots.push(slot);
				}
			});
			return {
				success: true,
				message: "Horários disponíveis encontrados",
				data: {
					availableSlots: validSlots,
					bookedSlots,
				},
			};
		}

		return {
			success: true,
			message: "Horários disponíveis encontrados",
			data: {
				availableSlots,
				bookedSlots,
			},
		};
	}

	/**
	 * Verifica conflitos de reserva considerando horários
	 */
	private async checkConflicts(
		amenityId: string,
		startDate: Date,
		endDate?: Date,
		startTime?: string,
		endTime?: string,
		excludeBookingId?: string,
	): Promise<boolean> {
		const query: any = {
			amenityId,
			status: {
				$in: [AmenityBookingStatusEnum.PENDENTE, AmenityBookingStatusEnum.CONFIRMADO],
			},
		};

		if (excludeBookingId) {
			query._id = { $ne: excludeBookingId };
		}

		// Para reserva por horas, verificar conflitos de horário no mesmo dia
		if (startTime && endTime) {
			const startOfDay = new Date(startDate);
			startOfDay.setHours(0, 0, 0, 0);
			const endOfDay = new Date(startDate);
			endOfDay.setHours(23, 59, 59, 999);

			query.startDate = {
				$gte: startOfDay,
				$lte: endOfDay,
			};

			const existingBookings = await this.amenityBookingRepository.findMany(query);

			const [startHour, startMin] = startTime.split(":").map(Number);
			const [endHour, endMin] = endTime.split(":").map(Number);
			const startMinutes = startHour * 60 + startMin;
			const endMinutes = endHour * 60 + endMin;

			for (const booking of existingBookings) {
				if (booking.startTime && booking.endTime) {
					const [bookStartHour, bookStartMin] = booking.startTime.split(":").map(Number);
					const [bookEndHour, bookEndMin] = booking.endTime.split(":").map(Number);
					const bookStartMinutes = bookStartHour * 60 + bookStartMin;
					const bookEndMinutes = bookEndHour * 60 + bookEndMin;

					// Verificar sobreposição de horários
					if (
						(startMinutes < bookEndMinutes && endMinutes > bookStartMinutes) ||
						(bookStartMinutes < endMinutes && bookEndMinutes > startMinutes)
					) {
						return true; // Conflito encontrado
					}
				}
			}
			return false; // Sem conflitos
		}

		// Para reserva diária, verificar conflitos de data
		if (endDate) {
			const conflictingBookings = await this.amenityBookingRepository.findConflictingBookings(
				amenityId,
				startDate,
				endDate,
				excludeBookingId,
			);
			return conflictingBookings.length > 0;
		}

		// Reserva de 1 dia
		const conflictingBookings = await this.amenityBookingRepository.findConflictingBookings(
			amenityId,
			startDate,
			startDate,
			excludeBookingId,
		);
		return conflictingBookings.length > 0;
	}

	public async createAmenityBooking(
		amenityBookingCreateDto: AmenityBookingCreateDto,
		apartmentId: string,
		residentId?: string,
	): Promise<HttpResponse<AmenityBookingEntity>> {
		// Verificar se a comodidade existe
		const amenity = await this.amenityRepository.findById(amenityBookingCreateDto.amenityId);

		if (!amenity) {
			throw httpException("Comodidade não encontrada", httpStatus.NOT_FOUND);
		}

		// Verificar se a comodidade está ativa
		if (amenity.status !== "ATIVO") {
			throw httpException("Comodidade não está disponível para reserva", httpStatus.BAD_REQUEST);
		}

		// Validar campos baseado no tipo de reserva
		if (amenity.bookingType === "POR_HORAS") {
			if (!amenityBookingCreateDto.startTime || !amenityBookingCreateDto.endTime) {
				throw httpException(
					"Horário de início e término são obrigatórios para reserva por horas",
					httpStatus.BAD_REQUEST,
				);
			}

			// Validar maxHours
			if (amenity.maxHours) {
				const [startHour, startMin] = amenityBookingCreateDto.startTime.split(":").map(Number);
				const [endHour, endMin] = amenityBookingCreateDto.endTime.split(":").map(Number);
				const startMinutes = startHour * 60 + startMin;
				const endMinutes = endHour * 60 + endMin;
				const hours = (endMinutes - startMinutes) / 60;

				if (hours > amenity.maxHours) {
					throw httpException(
						`A reserva não pode exceder ${amenity.maxHours} horas`,
						httpStatus.BAD_REQUEST,
					);
				}
			}
		} else {
			// DIARIO - endDate é obrigatório
			if (!amenityBookingCreateDto.endDate) {
				throw httpException(
					"Data de término é obrigatória para reserva diária",
					httpStatus.BAD_REQUEST,
				);
			}
		}

		// Verificar conflitos
		const hasConflict = await this.checkConflicts(
			amenityBookingCreateDto.amenityId,
			amenityBookingCreateDto.startDate,
			amenityBookingCreateDto.endDate,
			amenityBookingCreateDto.startTime,
			amenityBookingCreateDto.endTime,
		);

		if (hasConflict) {
			throw httpException("Já existe uma reserva neste período", httpStatus.CONFLICT);
		}

		// Calcular valor total
		const totalValue = this.calculateTotalValue(
			amenity,
			amenityBookingCreateDto.startDate,
			amenityBookingCreateDto.endDate,
			amenityBookingCreateDto.startTime,
			amenityBookingCreateDto.endTime,
			amenityBookingCreateDto.numberOfHours,
		);

		// Calcular número de horas/dias
		let numberOfHours: number | undefined;
		let numberOfDays: number | undefined;

		if (amenity.bookingType === "POR_HORAS") {
			if (amenityBookingCreateDto.numberOfHours) {
				numberOfHours = amenityBookingCreateDto.numberOfHours;
			} else if (amenityBookingCreateDto.startTime && amenityBookingCreateDto.endTime) {
				const [startHour, startMin] = amenityBookingCreateDto.startTime.split(":").map(Number);
				const [endHour, endMin] = amenityBookingCreateDto.endTime.split(":").map(Number);
				const startMinutes = startHour * 60 + startMin;
				const endMinutes = endHour * 60 + endMin;
				numberOfHours = Math.ceil((endMinutes - startMinutes) / 60);
			}
		} else {
			if (amenityBookingCreateDto.endDate) {
				const diffTime =
					amenityBookingCreateDto.endDate.getTime() - amenityBookingCreateDto.startDate.getTime();
				numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
			} else {
				numberOfDays = 1;
			}
		}

		// Preparar endDate para reserva por horas (mesmo dia)
		let endDate = amenityBookingCreateDto.endDate;
		if (amenity.bookingType === "POR_HORAS" && !endDate) {
			endDate = new Date(amenityBookingCreateDto.startDate);
		}

		// Gerar QR code se a comodidade for paga
		let qrCode: string | undefined;
		let qrCodeExpiry: Date | undefined;
		if (amenity.value && amenity.value > 0) {
			const bookingId = randomUUID();
			qrCode = this.generateQRCode(bookingId, totalValue);
			// QR code expira em 24 horas
			qrCodeExpiry = new Date();
			qrCodeExpiry.setHours(qrCodeExpiry.getHours() + 24);
		}

		const amenityBookingEntity: CreateAmenityBookingEntity = {
			amenityId: amenityBookingCreateDto.amenityId,
			apartmentId,
			residentId,
			startDate: amenityBookingCreateDto.startDate,
			endDate: endDate || amenityBookingCreateDto.startDate,
			startTime: amenityBookingCreateDto.startTime,
			endTime: amenityBookingCreateDto.endTime,
			numberOfHours,
			numberOfDays,
			status: AmenityBookingStatusEnum.PENDENTE,
			totalValue,
			qrCode,
			qrCodeExpiry,
			observation: amenityBookingCreateDto.observation,
		};

		const createdBooking = await this.amenityBookingRepository.create(amenityBookingEntity);

		return {
			success: true,
			message: "Reserva criada com sucesso! Aguardando confirmação.",
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

		// Serializar bookings sem Promise.all
		const serializedBookings: any[] = [];
		
		for (const booking of bookings) {
			if (!booking) {
				continue;
			}

			// Buscar amenity
			const amenity = await this.amenityRepository.findById(booking.amenityId);

			// Serializar o booking
			const serializedBooking: any = {
				_id: String(booking._id || ""),
				amenityId: String(booking.amenityId || ""),
				apartmentId: String(booking.apartmentId || ""),
				residentId: booking.residentId ? String(booking.residentId) : null,
				status: String(booking.status || ""),
				totalValue: Number(booking.totalValue || 0),
				startTime: booking.startTime || null,
				endTime: booking.endTime || null,
				numberOfHours: booking.numberOfHours || null,
				numberOfDays: booking.numberOfDays || null,
				qrCode: booking.qrCode || null,
				observation: booking.observation || null,
			};

				// Converter datas para ISO string
				if (booking.startDate) {
					serializedBooking.startDate = booking.startDate instanceof Date
						? booking.startDate.toISOString()
						: new Date(booking.startDate).toISOString();
				} else {
					serializedBooking.startDate = null;
				}

				if (booking.endDate) {
					serializedBooking.endDate = booking.endDate instanceof Date
						? booking.endDate.toISOString()
						: new Date(booking.endDate).toISOString();
				} else {
					serializedBooking.endDate = null;
				}

				if (booking.qrCodeExpiry) {
					serializedBooking.qrCodeExpiry = booking.qrCodeExpiry instanceof Date
						? booking.qrCodeExpiry.toISOString()
						: new Date(booking.qrCodeExpiry).toISOString();
				} else {
					serializedBooking.qrCodeExpiry = null;
				}

			if (booking.createdAt) {
				serializedBooking.createdAt = booking.createdAt instanceof Date
					? booking.createdAt.toISOString()
					: new Date(booking.createdAt).toISOString();
			} else {
				serializedBooking.createdAt = null;
			}

			if (booking.updatedAt) {
				serializedBooking.updatedAt = booking.updatedAt instanceof Date
					? booking.updatedAt.toISOString()
					: new Date(booking.updatedAt).toISOString();
			} else {
				serializedBooking.updatedAt = null;
			}

			if (booking.qrCodeExpiry) {
				serializedBooking.qrCodeExpiry = booking.qrCodeExpiry instanceof Date
					? booking.qrCodeExpiry.toISOString()
					: new Date(booking.qrCodeExpiry).toISOString();
			} else {
				serializedBooking.qrCodeExpiry = null;
			}

			// Adicionar dados da amenity
			if (amenity) {
				serializedBooking.amenity = {
					_id: String(amenity._id),
					name: String(amenity.name || ""),
					description: amenity.description ? String(amenity.description) : null,
					type: amenity.type ? String(amenity.type) : null,
					value: amenity.value ? Number(amenity.value) : null,
					fineValue: amenity.fineValue ? Number(amenity.fineValue) : null,
					maxResidents: amenity.maxResidents ? Number(amenity.maxResidents) : null,
					bookingType: amenity.bookingType ? String(amenity.bookingType) : null,
					maxHours: amenity.maxHours ? Number(amenity.maxHours) : null,
				};
			} else {
				serializedBooking.amenity = null;
			}

			serializedBookings.push(serializedBooking);
		}

		return {
			success: true,
			message: "Reservas encontradas",
			data: {
				bookings: serializedBookings,
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
			throw httpException("Reserva não encontrada", httpStatus.NOT_FOUND);
		}

		if (booking.status === AmenityBookingStatusEnum.CANCELADO) {
			throw httpException("Reserva já está cancelada", httpStatus.BAD_REQUEST);
		}

		const updatedBooking = await this.amenityBookingRepository.update(bookingId, {
			status: AmenityBookingStatusEnum.CANCELADO,
		});

		if (!updatedBooking) {
			throw httpException("Erro ao cancelar reserva", httpStatus.INTERNAL_SERVER_ERROR);
		}

		return {
			success: true,
			message: "Reserva cancelada com sucesso",
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
				message: "Nenhuma reserva encontrada",
				data: {
					bookings: [],
					total: 0,
				},
			};
		}

		// Filtrar reservas apenas com status PENDENTE, CONFIRMADO e EM_ANDAMENTO
		const filters: any = {
			amenityId: { $in: amenityIds },
			status: {
				$in: [
					AmenityBookingStatusEnum.PENDENTE,
					AmenityBookingStatusEnum.CONFIRMADO,
					AmenityBookingStatusEnum.EM_ANDAMENTO,
				],
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
					residentId: booking.residentId ? String(booking.residentId) : null,
					status: String(booking.status),
					totalValue: Number(booking.totalValue),
					startTime: booking.startTime || null,
					endTime: booking.endTime || null,
					numberOfHours: booking.numberOfHours || null,
					numberOfDays: booking.numberOfDays || null,
					qrCode: booking.qrCode || null,
					observation: booking.observation || null,
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
				} else {
					serializedBooking.createdAt = null;
				}

				if (booking.updatedAt) {
					serializedBooking.updatedAt = booking.updatedAt instanceof Date
						? booking.updatedAt.toISOString()
						: new Date(booking.updatedAt).toISOString();
				} else {
					serializedBooking.updatedAt = null;
				}

				// Adicionar dados da amenity
				serializedBooking.amenity = amenity
					? {
							_id: String(amenity._id),
							name: amenity.name,
							description: amenity.description || null,
							type: amenity.type || null,
							bookingType: amenity.bookingType || null,
							maxHours: amenity.maxHours || null,
						}
					: null;

				// Adicionar dados do apartment
				serializedBooking.apartment = apartment
					? {
							_id: String(apartment._id),
							number: apartment.number,
							floor: apartment.floor || null,
							block: apartment.block || null,
						}
					: null;

				// Adicionar dados do resident
				serializedBooking.resident = resident
					? {
							_id: String(resident._id),
							name: resident.name,
							email: resident.email,
						}
					: null;

				return serializedBooking;
			}),
		);

		// Filtrar nulls
		const validBookings = bookingsWithDetails.filter((booking) => booking !== null) as any[];

		return {
			success: true,
			message: "Reservas encontradas",
			data: {
				bookings: validBookings,
				total,
			},
		};
	}
}
