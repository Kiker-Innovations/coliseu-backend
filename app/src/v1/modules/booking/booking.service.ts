import type { MongoClient } from "mongodb";
import type {
	CreateBookingEntity,
	BookingEntity,
} from "../../../database/mongodb/entity/booking.entity";
import { BookingRepository } from "../../../database/mongodb/repositories/booking.repository";
import { AmenityRepository } from "../../../database/mongodb/repositories/amenity.repository";
import { ApartmentRepository } from "../../../database/mongodb/repositories/apartment.repository";
import { ResidentRepository } from "../../../database/mongodb/repositories/resident.repository";
import type {
	BookingCreateDto,
	BookingListQueryDto,
	BookingAvailabilityQueryDto,
	BookingAvailabilityResponse,
	BookingAvailabilityDay,
	BookingHoursAvailabilityQueryDto,
	BookingHoursAvailabilityResponse,
	BookingHoursAvailabilityHour,
} from "./dto";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";
import {
	BookingStatusEnum,
	type BookingStatusEnumType,
} from "../../enum/bookingStatus.enum";
import { PaymentService } from "../payment/payment.service";
import { PaymentRepository } from "@/database/mongodb/repositories/payment.repository";

export class BookingService {
	private bookingRepository: BookingRepository;
	private amenityRepository: AmenityRepository;
	private apartmentRepository: ApartmentRepository;
	private residentRepository: ResidentRepository;
	private paymentRepository: PaymentRepository;
	private mongoClient: MongoClient;
	private _paymentService: PaymentService | null = null;

	constructor(mongoClient: MongoClient) {
		this.bookingRepository = new BookingRepository(mongoClient);
		this.amenityRepository = new AmenityRepository(mongoClient);
		this.apartmentRepository = new ApartmentRepository(mongoClient);
		this.residentRepository = new ResidentRepository(mongoClient);
		this.paymentRepository = new PaymentRepository(mongoClient);
		this.mongoClient = mongoClient;
	}

	/**
	 * Lazy initialization para evitar dependência circular
	 */
	private get paymentService(): PaymentService {
		if (!this._paymentService) {
			this._paymentService = new PaymentService(this.mongoClient);
		}
		return this._paymentService;
	}

	/**
	 * Calcula o valor total da reserva baseado no tipo de reserva (DIARIO ou POR_HORAS)
	 */
	private calculateTotalValue(
		amenity: any,
		startDate: Date,
		endDate: Date,
	): number {
		if (!amenity.value || amenity.value === 0) {
			return 0;
		}

		// Se for DIARIO, sempre retorna o valor de 1 dia (não multiplica)
		if (amenity.bookingType === "DIARIO") {
			return amenity.value;
		}

		// Se for POR_HORAS, calcula baseado nas horas
		if (amenity.bookingType === "POR_HORAS") {
			const diffTime = endDate.getTime() - startDate.getTime();
			const diffHours = diffTime / (1000 * 60 * 60); // Diferença em horas

			// Arredondar para cima para cobrar horas completas
			const hours = Math.ceil(diffHours);

			// Verificar se não excede o máximo de horas permitido
			if (amenity.maxHours && hours > amenity.maxHours) {
				throw httpException(
					`O período selecionado excede o limite máximo de ${amenity.maxHours} horas`,
					httpStatus.BAD_REQUEST,
				);
			}

			// Valor por hora multiplicado pelo número de horas
			return amenity.value * hours;
		}

		// Fallback: retorna o valor padrão
		return amenity.value;
	}

	private async checkConflicts(
		amenityId: string,
		startDate: Date,
		endDate?: Date,
		excludeBookingId?: string,
	): Promise<boolean> {
		// Para reserva diária, verificar conflitos de data
		if (endDate) {
			const conflictingBookings =
				await this.bookingRepository.findConflictingBookings(
					amenityId,
					startDate,
					endDate,
					excludeBookingId,
				);
			return conflictingBookings.length > 0;
		}

		// Reserva de 1 dia
		const conflictingBookings =
			await this.bookingRepository.findConflictingBookings(
				amenityId,
				startDate,
				startDate,
				excludeBookingId,
			);
		return conflictingBookings.length > 0;
	}

	public async createBooking(
		bookingCreateDto: BookingCreateDto,
		apartmentId: string,
		residentId: string | undefined,
		buildingId: string,
	): Promise<HttpResponse<BookingEntity>> {
		const amenity = await this.amenityRepository.findById(
			bookingCreateDto.amenityId,
		);

		if (!amenity) {
			throw httpException("Comodidade não encontrada", httpStatus.NOT_FOUND);
		}

		if (amenity.status !== "ATIVO") {
			throw httpException(
				"Comodidade não está disponível para reserva",
				httpStatus.BAD_REQUEST,
			);
		}

		if (!bookingCreateDto.endDate) {
			throw httpException(
				"Data de término é obrigatória",
				httpStatus.BAD_REQUEST,
			);
		}

		// Validação para reserva DIARIO: só pode ser 1 dia
		if (amenity.bookingType === "DIARIO") {
			const diffTime =
				bookingCreateDto.endDate.getTime() -
				bookingCreateDto.startDate.getTime();
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

			if (diffDays > 1) {
				throw httpException(
					"Reservas diárias só podem ser feitas para 1 dia",
					httpStatus.BAD_REQUEST,
				);
			}
		}

		const hasConflict = await this.checkConflicts(
			bookingCreateDto.amenityId,
			bookingCreateDto.startDate,
			bookingCreateDto.endDate,
		);

		if (hasConflict) {
			throw httpException(
				"Já existe uma reserva neste período",
				httpStatus.CONFLICT,
			);
		}

		// Calcular o valor total baseado no tipo de reserva
		const totalValue = this.calculateTotalValue(
			amenity,
			bookingCreateDto.startDate,
			bookingCreateDto.endDate,
		);

		// Calcular numberOfDays apenas para DIARIO
		let numberOfDays: number | undefined;
		if (amenity.bookingType === "DIARIO") {
			numberOfDays = 1; // Sempre 1 dia para DIARIO
		} else {
			// Para POR_HORAS, não precisa de numberOfDays
			numberOfDays = undefined;
		}

		const endDate = bookingCreateDto.endDate;

		const bookingEntity: CreateBookingEntity = {
			amenityId: bookingCreateDto.amenityId,
			apartmentId,
			buildingId,
			residentId,
			startDate: bookingCreateDto.startDate,
			endDate: endDate || bookingCreateDto.startDate,
			numberOfDays,
			status: BookingStatusEnum.PENDENTE,
			totalValue,
			observation: bookingCreateDto.observation,
		};

		let createdBooking = await this.bookingRepository.create(bookingEntity);

		if (createdBooking && createdBooking.totalValue > 0) {
			if (!createdBooking.residentId) {
				throw httpException(
					"Residente é obrigatório para criar pagamento",
					httpStatus.BAD_REQUEST,
				);
			}

			try {
				console.log(
					"Iniciando criação de pagamento para reserva:",
					createdBooking._id,
				);
				const webPayment =
					await this.paymentService.createWebPayment(createdBooking);
				console.log("WebPayment criado:", webPayment?.id || "sem ID");

				if (webPayment) {
					const paymentResult = await this.paymentService.createPayment(
						{
							entityOriginId: createdBooking._id,
							value: createdBooking.totalValue,
							residentId: createdBooking.residentId,
							apartmentId: createdBooking.apartmentId,
							buildingId: createdBooking.buildingId,
							type: "BOOKING",
						},
						webPayment,
					);
					console.log("Pagamento criado com sucesso:", paymentResult);

					// Buscar a reserva atualizada com paymentUrl e paymentId
					const updatedBooking = await this.bookingRepository.findById(
						createdBooking._id,
					);
					if (updatedBooking) {
						createdBooking = updatedBooking;
					}
				} else {
					console.error("WebPayment não foi retornado pela API do AbacatePay");
				}
			} catch (error: any) {
				console.error("Erro ao criar pagamento:", {
					message: error.message,
					statusCode: error.statusCode,
					stack: error.stack,
					bookingId: createdBooking._id,
				});
				// Não relançar o erro para não impedir a criação da reserva
				// Mas logar detalhadamente para debug
			}
		}

		return {
			success: true,
			message: "Reserva criada com sucesso! Aguardando confirmação.",
			data: createdBooking,
		};
	}

	public async getBookings(query: BookingListQueryDto, apartmentId: string) {
		// Filtrar apenas por apartmentId (obrigatório)
		const filters: any = {
			apartmentId,
		};

		// Buscar bookings com paginação no banco
		const { bookings, total } = await this.bookingRepository.listWithFilters(
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

			const amenity = await this.amenityRepository.findById(booking.amenityId);

			const serializedBooking: any = {
				_id: String(booking._id || ""),
				amenityId: String(booking.amenityId || ""),
				apartmentId: String(booking.apartmentId || ""),
				residentId: booking.residentId ? String(booking.residentId) : null,
				status: String(booking.status || ""),
				totalValue: Number(booking.totalValue || 0),
				numberOfDays: booking.numberOfDays || null,
				observation: booking.observation || null,
				paymentUrl: booking.paymentUrl || null,
				paymentId: booking.paymentId || null,
			};

			// Converter datas para ISO string
			if (booking.startDate) {
				serializedBooking.startDate =
					booking.startDate instanceof Date
						? booking.startDate.toISOString()
						: new Date(booking.startDate).toISOString();
			} else {
				serializedBooking.startDate = null;
			}

			if (booking.endDate) {
				serializedBooking.endDate =
					booking.endDate instanceof Date
						? booking.endDate.toISOString()
						: new Date(booking.endDate).toISOString();
			} else {
				serializedBooking.endDate = null;
			}

			if (booking.createdAt) {
				serializedBooking.createdAt =
					booking.createdAt instanceof Date
						? booking.createdAt.toISOString()
						: new Date(booking.createdAt).toISOString();
			} else {
				serializedBooking.createdAt = null;
			}

			if (booking.updatedAt) {
				serializedBooking.updatedAt =
					booking.updatedAt instanceof Date
						? booking.updatedAt.toISOString()
						: new Date(booking.updatedAt).toISOString();
			} else {
				serializedBooking.updatedAt = null;
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
					maxResidents: amenity.maxResidents
						? Number(amenity.maxResidents)
						: null,
					bookingType: amenity.bookingType ? String(amenity.bookingType) : null,
				};
			} else {
				serializedBooking.amenity = null;
			}

			// Payment não é mais buscado separadamente, os dados estão no booking
			serializedBooking.payment = null;

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

	public async cancelBooking(
		bookingId: string,
	): Promise<HttpResponse<BookingEntity>> {
		const booking = await this.bookingRepository.findById(bookingId);

		if (!booking) {
			throw httpException("Reserva não encontrada", httpStatus.NOT_FOUND);
		}

		if (booking.status === BookingStatusEnum.CANCELADO) {
			throw httpException("Reserva já está cancelada", httpStatus.BAD_REQUEST);
		}

		// Buscar o pagamento associado à reserva
		const payment =
			await this.paymentRepository.findByEntityOriginId(bookingId);

		// Se houver pagamento, cancelar no AbacatePay e no banco
		if (payment) {
			await this.paymentService.cancelPayment(payment);
		}

		const updatedBooking = await this.bookingRepository.update(bookingId, {
			status: BookingStatusEnum.CANCELADO,
		});

		if (!updatedBooking) {
			throw httpException(
				"Erro ao cancelar reserva",
				httpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		return {
			success: true,
			message: "Reserva cancelada com sucesso",
			data: updatedBooking,
		};
	}

	public async getBookingsByBuilding(
		buildingId: string,
		amenityId?: string,
	): Promise<HttpResponse<{ bookings: any[]; total: number }>> {
		if (!buildingId) {
			throw httpException(
				"ID do edifício é obrigatório",
				httpStatus.BAD_REQUEST,
			);
		}

		// Se um amenityId específico foi fornecido, verificar se pertence ao building
		if (amenityId) {
			const amenity = await this.amenityRepository.findById(amenityId);
			if (!amenity || amenity.buildingId !== buildingId) {
				throw httpException(
					"Comodidade não encontrada ou não pertence a este edifício",
					httpStatus.NOT_FOUND,
				);
			}
		}

		// Buscar todas as amenities do building ou usar o amenityId específico
		let amenityIds: string[];
		if (amenityId) {
			amenityIds = [amenityId];
		} else {
			const amenities = await this.amenityRepository.findMany({ buildingId });
			amenityIds = amenities.map((a) => a._id);
		}

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

		// Filtrar reservas com status PENDENTE, AGENDADO, EM_ANDAMENTO e FINALIZADO (exclui apenas CANCELADO)
		const filters: any = {
			amenityId: amenityId ? amenityId : { $in: amenityIds },
			status: {
				$in: [
					BookingStatusEnum.PENDENTE,
					BookingStatusEnum.AGENDADO,
					BookingStatusEnum.EM_ANDAMENTO,
					BookingStatusEnum.FINALIZADO,
				],
			},
		};

		// Buscar bookings
		const { bookings, total } =
			await this.bookingRepository.listWithFilters(filters);

		// Buscar dados completos (amenity, apartment, resident) para cada booking
		const bookingsWithDetails = await Promise.all(
			bookings.map(async (booking) => {
				if (!booking) {
					return null;
				}

				const amenity = await this.amenityRepository.findById(
					booking.amenityId,
				);
				const apartment = await this.apartmentRepository.findById(
					booking.apartmentId,
				);

				// Buscar resident do apartment
				let resident = null;
				if (apartment) {
					const residents = await this.residentRepository.findMany({
						apartmentId: apartment._id,
					});
					// Pegar o primeiro resident ativo ou o primeiro disponível
					resident =
						residents.find((r) => r.status === "ATIVO") || residents[0] || null;
				}

				// Serializar o booking
				const serializedBooking: any = {
					_id: String(booking._id),
					amenityId: String(booking.amenityId),
					apartmentId: String(booking.apartmentId),
					residentId: booking.residentId ? String(booking.residentId) : null,
					status: String(booking.status),
					totalValue: Number(booking.totalValue),
					numberOfDays: booking.numberOfDays || null,
					observation: booking.observation || null,
				};

				// Converter datas para ISO string
				if (booking.startDate) {
					serializedBooking.startDate =
						booking.startDate instanceof Date
							? booking.startDate.toISOString()
							: new Date(booking.startDate).toISOString();
				}

				if (booking.endDate) {
					serializedBooking.endDate =
						booking.endDate instanceof Date
							? booking.endDate.toISOString()
							: new Date(booking.endDate).toISOString();
				}

				if (booking.createdAt) {
					serializedBooking.createdAt =
						booking.createdAt instanceof Date
							? booking.createdAt.toISOString()
							: new Date(booking.createdAt).toISOString();
				} else {
					serializedBooking.createdAt = null;
				}

				if (booking.updatedAt) {
					serializedBooking.updatedAt =
						booking.updatedAt instanceof Date
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
		const validBookings = bookingsWithDetails.filter(
			(booking) => booking !== null,
		) as any[];

		return {
			success: true,
			message: "Reservas encontradas",
			data: {
				bookings: validBookings,
				total,
			},
		};
	}

	/**
	 * Atualiza o status da reserva baseado na hora atual e se o pagamento foi feito
	 * Status possíveis:
	 * - PENDENTE: Pagamento não foi feito
	 * - AGENDADO: Pagamento foi feito mas ainda não começou (hora atual < startDate)
	 * - EM_ANDAMENTO: Pagamento foi feito e está dentro do período (hora atual >= startDate && hora atual <= endDate)
	 * - FINALIZADO: Pagamento foi feito e já passou do período (hora atual > endDate)
	 */
	public async updateBookingStatus(
		booking: BookingEntity,
	): Promise<BookingEntity> {
		const now = new Date();
		const startDate = new Date(booking.startDate);
		const endDate = new Date(booking.endDate);

		// Verifica se o pagamento foi feito
		const payment = await this.paymentRepository.findByEntityOriginId(
			booking._id,
		);
		const isPaid = payment && payment.status === "PAGO";

		let newStatus: BookingStatusEnumType;

		if (!isPaid) {
			// Se não foi pago, mantém como PENDENTE
			newStatus = BookingStatusEnum.PENDENTE;
		} else if (now < startDate) {
			// Pagamento feito mas ainda não começou
			newStatus = BookingStatusEnum.AGENDADO;
		} else if (now >= startDate && now <= endDate) {
			// Pagamento feito e está dentro do período
			newStatus = BookingStatusEnum.EM_ANDAMENTO;
		} else {
			// Pagamento feito mas já passou do período
			newStatus = BookingStatusEnum.FINALIZADO;
		}

		// Atualiza apenas se o status mudou
		if (booking.status !== newStatus) {
			const updatedBooking = await this.bookingRepository.update(booking._id, {
				status: newStatus,
				updatedAt: now,
			});

			return updatedBooking || booking;
		}

		return booking;
	}

	/**
	 * Atualiza o status da reserva verificando se há pagamento com status PAGO ou EXPIRADO vinculado
	 */
	public async updateBookingStatusByPayment(
		booking: BookingEntity,
	): Promise<BookingEntity> {
		const payment = await this.paymentRepository.findByEntityOriginId(
			booking._id,
		);

		if (!payment) {
			return booking;
		}

		// Se o pagamento está expirado, cancela o booking
		if (payment.status === "EXPIRADO") {
			return (
				(await this.bookingRepository.update(booking._id, {
					status: BookingStatusEnum.CANCELADO,
					canceledAt: new Date(),
				})) || booking
			);
		}

		// Se o pagamento está pago, atualiza o status baseado na hora atual
		if (payment.status === "PAGO") {
			return await this.updateBookingStatus(booking);
		}

		return booking;
	}

	/**
	 * Calcula a disponibilidade de dias para uma amenity em um período
	 * Retorna um array de dias indicando quais estão disponíveis e quais não estão
	 */
	public async getAvailability(
		availabilityQuery: BookingAvailabilityQueryDto,
	): Promise<HttpResponse<BookingAvailabilityResponse>> {
		const { amenityId, startDate, endDate } = availabilityQuery;

		// Validar amenity
		const amenity = await this.amenityRepository.findById(amenityId);
		if (!amenity) {
			throw httpException("Comodidade não encontrada", httpStatus.NOT_FOUND);
		}

		// Converter strings para Date
		const start = new Date(startDate);
		const end = new Date(endDate);

		// Validar datas
		if (isNaN(start.getTime()) || isNaN(end.getTime())) {
			throw httpException(
				"Datas inválidas. Use formato ISO (YYYY-MM-DD)",
				httpStatus.BAD_REQUEST,
			);
		}

		if (start > end) {
			throw httpException(
				"Data de início deve ser anterior à data de término",
				httpStatus.BAD_REQUEST,
			);
		}

		// Buscar bookings ocupados no período
		const occupiedBookings = await this.bookingRepository.findOccupiedBookings(
			amenityId,
			start,
			end,
		);

		// Criar conjunto de datas ocupadas
		const occupiedDates = new Set<string>();

		occupiedBookings.forEach((booking) => {
			const bookingStart = new Date(booking.startDate);
			const bookingEnd = new Date(booking.endDate);

			// Normalizar para início do dia (00:00:00)
			bookingStart.setHours(0, 0, 0, 0);
			bookingEnd.setHours(0, 0, 0, 0);

			// Adicionar todas as datas entre startDate e endDate (inclusive)
			const currentDate = new Date(bookingStart);
			while (currentDate <= bookingEnd) {
				const dateStr = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD
				occupiedDates.add(dateStr);
				currentDate.setDate(currentDate.getDate() + 1);
			}
		});

		// Gerar array de dias no período
		const days: BookingAvailabilityDay[] = [];
		const currentDate = new Date(start);
		currentDate.setHours(0, 0, 0, 0);
		const endDateNormalized = new Date(end);
		endDateNormalized.setHours(0, 0, 0, 0);

		while (currentDate <= endDateNormalized) {
			const dateStr = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD
			days.push({
				date: dateStr,
				available: !occupiedDates.has(dateStr),
			});
			currentDate.setDate(currentDate.getDate() + 1);
		}

		return {
			success: true,
			message: "Disponibilidade calculada com sucesso",
			data: {
				amenityId,
				startDate,
				endDate,
				days,
			},
		};
	}

	/**
	 * Calcula a disponibilidade de horas para uma amenity em um dia específico
	 * Retorna um array de horas (0-23) indicando quais estão disponíveis e quais não estão
	 */
	public async getHoursAvailability(
		availabilityQuery: BookingHoursAvailabilityQueryDto,
	): Promise<HttpResponse<BookingHoursAvailabilityResponse>> {
		const { amenityId, date } = availabilityQuery;

		// Validar amenity
		const amenity = await this.amenityRepository.findById(amenityId);
		if (!amenity) {
			throw httpException("Comodidade não encontrada", httpStatus.NOT_FOUND);
		}

		// Validar que a amenity é do tipo POR_HORAS
		if (amenity.bookingType !== "POR_HORAS") {
			throw httpException(
				"Esta comodidade não permite reserva por horas",
				httpStatus.BAD_REQUEST,
			);
		}

		// Converter string para Date
		const selectedDate = new Date(date + "T00:00:00");
		if (isNaN(selectedDate.getTime())) {
			throw httpException(
				"Data inválida. Use formato ISO (YYYY-MM-DD)",
				httpStatus.BAD_REQUEST,
			);
		}

		// Definir início e fim do dia
		const dayStart = new Date(selectedDate);
		dayStart.setHours(0, 0, 0, 0);
		const dayEnd = new Date(selectedDate);
		dayEnd.setHours(23, 59, 59, 999);

		// Buscar bookings ocupados neste dia
		const occupiedBookings = await this.bookingRepository.findOccupiedBookings(
			amenityId,
			dayStart,
			dayEnd,
		);

		// Criar conjunto de horas ocupadas (0-23)
		const occupiedHours = new Set<number>();

		occupiedBookings.forEach((booking) => {
			const bookingStart = new Date(booking.startDate);
			const bookingEnd = new Date(booking.endDate);

			// Para cada hora do dia (0-23), verificar se o booking ocupa essa hora
			for (let hour = 0; hour < 24; hour++) {
				const hourStart = new Date(selectedDate);
				hourStart.setHours(hour, 0, 0, 0);
				const hourEnd = new Date(selectedDate);
				hourEnd.setHours(hour, 59, 59, 999);

				// Verificar se há sobreposição entre o booking e a hora
				// Há sobreposição se: bookingStart <= hourEnd && bookingEnd >= hourStart
				if (bookingStart <= hourEnd && bookingEnd >= hourStart) {
					occupiedHours.add(hour);
				}
			}
		});

		// Verificar horário de funcionamento da amenity
		let openingHour = 0;
		let closingHour = 23;

		if (amenity.openingTime && amenity.closingTime) {
			const [openingHourStr, openingMinuteStr] = amenity.openingTime.split(":");
			const [closingHourStr, closingMinuteStr] = amenity.closingTime.split(":");
			openingHour = parseInt(openingHourStr, 10);
			closingHour = parseInt(closingHourStr, 10);
		}

		// Gerar array de horas (0-23)
		const hours: BookingHoursAvailabilityHour[] = [];
		let hasAvailableHour = false;

		for (let hour = 0; hour < 24; hour++) {
			// Verificar se a hora está dentro do horário de funcionamento
			const isWithinOperatingHours = hour >= openingHour && hour < closingHour;
			// Verificar se não está ocupada
			const isNotOccupied = !occupiedHours.has(hour);
			// Hora está disponível se estiver dentro do horário de funcionamento E não estiver ocupada
			const isAvailable = isWithinOperatingHours && isNotOccupied;

			if (isAvailable) {
				hasAvailableHour = true;
			}
			hours.push({
				hour,
				available: isAvailable,
			});
		}

		return {
			success: true,
			message: "Disponibilidade de horas calculada com sucesso",
			data: {
				amenityId,
				date,
				dayAvailable: hasAvailableHour,
				hours,
			},
		};
	}
}
