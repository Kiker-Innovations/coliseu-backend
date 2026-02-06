import type { MongoClient } from "mongodb";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";
import { PaymentRepository } from "../../../database/mongodb/repositories/payment.repository";
import { BuildingRepository } from "../../../database/mongodb/repositories/building.repository";
import { ResidentRepository } from "../../../database/mongodb/repositories/resident.repository";
import { ApartmentRepository } from "../../../database/mongodb/repositories/apartment.repository";
import { BookingRepository } from "../../../database/mongodb/repositories/booking.repository";
import { AmenityRepository } from "../../../database/mongodb/repositories/amenity.repository";
import { BookingService } from "../booking/booking.service";
import type { CreatePaymentEntity } from "../../../database/mongodb/entity/payment.entity";
import type { PaymentCreateDto, PaymentUpdateDto } from "./dto";
import type { BookingEntity } from "@/database/mongodb/entity/booking.entity";
import { env } from "../../../config/env";

export class PaymentService {
	private paymentRepository: PaymentRepository;
	private buildingRepository: BuildingRepository;
	private residentRepository: ResidentRepository;
	private apartmentRepository: ApartmentRepository;
	private bookingRepository: BookingRepository;
	private amenityRepository: AmenityRepository;
	private mongoClient: MongoClient;
	private _bookingService: BookingService | null = null;

	constructor(mongoClient: MongoClient) {
		this.paymentRepository = new PaymentRepository(mongoClient);
		this.buildingRepository = new BuildingRepository(mongoClient);
		this.residentRepository = new ResidentRepository(mongoClient);
		this.apartmentRepository = new ApartmentRepository(mongoClient);
		this.bookingRepository = new BookingRepository(mongoClient);
		this.amenityRepository = new AmenityRepository(mongoClient);
		this.mongoClient = mongoClient;
	}

	/**
	 * Lazy initialization para evitar dependência circular
	 */
	private get bookingService(): BookingService {
		if (!this._bookingService) {
			this._bookingService = new BookingService(this.mongoClient);
		}
		return this._bookingService;
	}

	public async createWebPayment(originEntity: BookingEntity): Promise<any> {
		const resident = await this.residentRepository.findById(
			originEntity.residentId,
		);
		if (!resident) {
			throw httpException("Residente não encontrado", httpStatus.NOT_FOUND);
		}

		const amenity = await this.amenityRepository.findById(
			originEntity.amenityId,
		);
		if (!amenity) {
			throw httpException("Comodidade não encontrada", httpStatus.NOT_FOUND);
		}

		const token = process.env.ABACATEPAY_API_KEY;
		if (!token) {
			throw httpException(
				"Token de autenticação não encontrado",
				httpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		const cleanDocument = resident.document.replace(/\D/g, "");
		const cleanPhone = resident.phone.replace(/\D/g, "").replace(/^55/, "");
		const priceInCents = Math.round(originEntity.totalValue * 100);
		const baseUrl = env.app.baseUrl.replace(/\/+$/, "");
		const returnUrl =
			process.env.ABACATEPAY_RETURN_URL || `${baseUrl}/bookings`;
		const completionUrl =
			process.env.ABACATEPAY_COMPLETION_URL || `${baseUrl}/bookings`;

		const options = {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				frequency: "ONE_TIME",
				methods: ["PIX"],
				products: [
					{
						externalId: `booking-${originEntity._id}`,
						name: amenity.name || "Reserva de Comodidade",
						description: `Reserva de ${amenity.name || "comodidade"}`,
						quantity: 1,
						price: priceInCents,
					},
				],
				returnUrl: returnUrl,
				completionUrl: completionUrl,
				customer: {
					name: resident.name,
					cellphone: cleanPhone,
					email: resident.email,
					taxId: cleanDocument,
				},
				allowCoupons: false,
				externalId: originEntity._id,
				metadata: { externalId: originEntity._id },
			}),
		};

		try {
			const response = await fetch(
				"https://api.abacatepay.com/v1/billing/create",
				options,
			);
			const data = await response.json();

			if (!response.ok || data.error) {
				throw httpException(
					data.error || data.message || "Erro ao criar pagamento no AbacatePay",
					httpStatus.BAD_REQUEST,
				);
			}

			// A URL de pagamento já vem na resposta da billing
			// data.data.url contém a URL para o usuário acessar e pagar

			return data.data || data;
		} catch (error: any) {
			if (error.statusCode) {
				throw error;
			}
			throw httpException(
				"Erro ao comunicar com o gateway de pagamento",
				httpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	public async createPayment(paymentData: any, webPayment: any) {
		const paymentOriginId = webPayment.id || webPayment.paymentOriginId;

		if (!paymentOriginId) {
			throw httpException(
				"ID do pagamento não encontrado na resposta do gateway",
				httpStatus.BAD_REQUEST,
			);
		}

		const existingPayment =
			await this.paymentRepository.findByPaymentOriginId(paymentOriginId);

		if (existingPayment) {
			throw httpException(
				"Já existe um pagamento com este paymentOriginId",
				httpStatus.CONFLICT,
			);
		}

		const value = webPayment.amount
			? webPayment.amount / 100
			: paymentData.value;
		const expiresAt = webPayment.expiresAt
			? new Date(webPayment.expiresAt)
			: new Date(Date.now() + 1800 * 1000);

		const paymentEntity: CreatePaymentEntity = {
			paymentOriginId: paymentOriginId,
			entityOriginId: paymentData.entityOriginId,
			paymentUrl: webPayment.url || "",
			platformFee: webPayment.platformFee || 0,
			method: (webPayment.methods && webPayment.methods[0]) || "PIX",
			type: paymentData.type as "BOOKING",
			gateway: "ABACATEPAY",
			value: value,
			residentId: paymentData.residentId,
			apartmentId: paymentData.apartmentId,
			buildingId: paymentData.buildingId,
			status: webPayment.status === "PENDING" ? "PENDENTE" : "PENDENTE",
			error: webPayment.error || undefined,
			expiresAt: expiresAt,
			paidAt: undefined,
		};

		const createdPayment = await this.paymentRepository.create(paymentEntity);

		// Atualizar booking com paymentUrl e paymentId
		if (paymentData.type === "BOOKING" && paymentData.entityOriginId) {
			await this.bookingRepository.update(paymentData.entityOriginId, {
				paymentUrl: webPayment.url || "",
				paymentId: createdPayment._id,
			});
		}

		return {
			success: true,
			message: "Pagamento criado com sucesso",
		};
	}

	public async updateStatus(
		payment: any,
		webPayment: any,
		status: "PAGO" | "EXPIRADO",
	) {
		const updateData: any = {
			status: status,
			updatedAt: new Date(),
		};

		if (status === "PAGO") {
			if (!payment.paidAt) {
				updateData.paidAt = new Date();
			}
		} else if (status === "EXPIRADO") {
			const expiresAt = webPayment.data.billing.expiresAt
				? new Date(webPayment.data.billing.expiresAt)
				: new Date();
			updateData.expiresAt = expiresAt;
			updateData.canceledAt = new Date();
		}

		const updatedPayment = await this.paymentRepository.update(
			payment._id,
			updateData,
		);

		if (!updatedPayment) {
			throw httpException(
				"Erro ao atualizar status do pagamento",
				httpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		return updatedPayment;
	}

	public async updatePayment(webPayment: any) {
		const payment = await this.paymentRepository.findByPaymentOriginId(
			webPayment.data.billing.id,
		);

		if (!payment) {
			throw httpException("Pagamento não encontrado", httpStatus.NOT_FOUND);
		}

		const billingStatus = webPayment.data.billing.status;
		const isBooking = payment.type === "BOOKING";

		if (
			(billingStatus === "PAID" || billingStatus === "EXPIRED") &&
			isBooking
		) {
			const booking = await this.bookingRepository.findById(
				payment.entityOriginId,
			);
			if (booking) {
				const paymentStatus = billingStatus === "PAID" ? "PAGO" : "EXPIRADO";
				await this.updateStatus(payment, webPayment, paymentStatus);
				await this.bookingService.updateBookingStatusByPayment(booking);
			}
		}

		return {
			success: true,
			message: "Pagamento atualizado com sucesso",
		};
	}

	public async updatePaymentByOriginId(
		paymentUpdateDto: PaymentUpdateDto,
	): Promise<
		HttpResponse<{
			_id: string;
			paymentOriginId: string;
			status: string;
			error?: string;
			updatedAt: Date;
		}>
	> {
		if (!paymentUpdateDto.paymentOriginId) {
			throw httpException(
				"paymentOriginId é obrigatório",
				httpStatus.BAD_REQUEST,
			);
		}

		const payment = await this.paymentRepository.findByPaymentOriginId(
			paymentUpdateDto.paymentOriginId,
		);

		if (!payment) {
			throw httpException("Pagamento não encontrado", httpStatus.NOT_FOUND);
		}

		const updatedPayment = await this.paymentRepository.update(
			payment._id,
			paymentUpdateDto,
		);

		if (!updatedPayment) {
			throw httpException(
				"Erro ao atualizar pagamento",
				httpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		return {
			success: true,
			message: "Pagamento atualizado com sucesso",
			data: {
				_id: updatedPayment._id,
				paymentOriginId: updatedPayment.paymentOriginId,
				status: updatedPayment.status,
				error: updatedPayment.error,
				updatedAt: updatedPayment.updatedAt,
			},
		};
	}

	/**
	 * Busca um pagamento por ID
	 */
	public async getPaymentById(paymentId: string): Promise<
		HttpResponse<{
			_id: string;
			paymentOriginId: string;
			entityOriginId: string;
			paymentUrl: string;
			platformFee: number;
			type: string;
			gateway: string;
			value: number;
			residentId: string;
			apartmentId: string;
			buildingId: string;
			status: string;
			error?: string;
			createdAt: Date;
			updatedAt: Date;
			expiresAt: Date;
		}>
	> {
		const payment = await this.paymentRepository.findById(paymentId);

		if (!payment) {
			throw httpException("Pagamento não encontrado", httpStatus.NOT_FOUND);
		}

		return {
			success: true,
			message: "Pagamento recuperado com sucesso",
			data: {
				_id: payment._id,
				paymentOriginId: payment.paymentOriginId,
				entityOriginId: payment.entityOriginId,
				paymentUrl: payment.paymentUrl,
				platformFee: payment.platformFee,
				type: payment.type,
				gateway: payment.gateway,
				value: payment.value,
				residentId: payment.residentId,
				apartmentId: payment.apartmentId,
				buildingId: payment.buildingId,
				status: payment.status,
				error: payment.error,
				createdAt: payment.createdAt,
				updatedAt: payment.updatedAt,
				expiresAt: payment.expiresAt,
			},
		};
	}

	/**
	 * Busca pagamentos por paymentOriginId (útil para webhook)
	 */
	public async getPaymentByPaymentOriginId(paymentOriginId: string): Promise<
		HttpResponse<{
			_id: string;
			paymentOriginId: string;
			status: string;
		}>
	> {
		const payment =
			await this.paymentRepository.findByPaymentOriginId(paymentOriginId);

		if (!payment) {
			throw httpException("Pagamento não encontrado", httpStatus.NOT_FOUND);
		}

		return {
			success: true,
			message: "Pagamento recuperado com sucesso",
			data: {
				_id: payment._id,
				paymentOriginId: payment.paymentOriginId,
				status: payment.status,
			},
		};
	}

	/**
	 * Busca pagamento por entityOriginId (ID do booking)
	 */
	public async getPaymentByEntityOriginId(entityOriginId: string): Promise<
		HttpResponse<{
			_id: string;
			paymentOriginId: string;
			entityOriginId: string;
			paymentUrl: string;
			platformFee: number;
			method: string;
			type: string;
			gateway: string;
			value: number;
			residentId: string;
			apartmentId: string;
			buildingId: string;
			status: string;
			error?: string;
			createdAt: Date;
			updatedAt: Date;
			expiresAt: Date;
		}>
	> {
		const payment =
			await this.paymentRepository.findByEntityOriginId(entityOriginId);

		if (!payment) {
			throw httpException("Pagamento não encontrado", httpStatus.NOT_FOUND);
		}

		return {
			success: true,
			message: "Pagamento recuperado com sucesso",
			data: {
				_id: payment._id,
				paymentOriginId: payment.paymentOriginId,
				entityOriginId: payment.entityOriginId,
				paymentUrl: payment.paymentUrl,
				platformFee: payment.platformFee,
				method: payment.method,
				type: payment.type,
				gateway: payment.gateway,
				value: payment.value,
				residentId: payment.residentId,
				apartmentId: payment.apartmentId,
				buildingId: payment.buildingId,
				status: payment.status,
				error: payment.error,
				createdAt: payment.createdAt,
				updatedAt: payment.updatedAt,
				expiresAt: payment.expiresAt,
			},
		};
	}

	/**
	 * Cancela um pagamento no AbacatePay e atualiza o status no banco
	 */
	public async cancelPayment(payment: any): Promise<void> {
		// Se o pagamento já está cancelado ou pago, não faz nada
		if (payment.status === "CANCELADO" || payment.status === "PAGO") {
			return;
		}

		const token = process.env.ABACATEPAY_API_KEY;

		if (!token) {
			throw httpException(
				"Token de autenticação não encontrado",
				httpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		// Cancela o pagamento na API do AbacatePay
		try {
			const headers = {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			};

			// Tentar cancelar como billing primeiro (se o ID começar com 'bill_')
			let response;
			let data;

			if (payment.paymentOriginId.startsWith("bill_")) {
				// Formato billing
				response = await fetch(
					`https://api.abacatepay.com/v1/billing/${payment.paymentOriginId}/cancel`,
					{
						method: "POST",
						headers,
					},
				);
				data = await response.json();
			} else {
				// Formato pixQrCode (legado)
				response = await fetch(
					`https://api.abacatepay.com/v1/pixQrCode/cancel`,
					{
						method: "POST",
						headers,
						body: JSON.stringify({
							id: payment.paymentOriginId,
						}),
					},
				);
				data = await response.json();
			}

			if (!response.ok || data.error) {
				console.error("Erro ao cancelar pagamento no AbacatePay:", data);
				// Continua mesmo se falhar na API, mas atualiza no banco
				// Isso garante que o status seja atualizado mesmo se a API externa falhar
			} else {
				console.log("Pagamento cancelado com sucesso no AbacatePay");
			}
		} catch (error: any) {
			console.error("Erro ao comunicar com AbacatePay para cancelar:", error);
			// Continua mesmo se falhar na API, mas atualiza no banco
			// Isso garante que o status seja atualizado mesmo se a API externa falhar
		}

		// Atualiza o status do pagamento no banco para CANCELADO
		await this.paymentRepository.update(payment._id, {
			status: "CANCELADO",
			canceledAt: new Date(),
			updatedAt: new Date(),
		});
	}
}
