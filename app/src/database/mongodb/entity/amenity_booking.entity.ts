import type { AmenityBookingStatusEnumType } from "@/v1/enum/amenityBookingStatus.enum";

export interface AmenityBookingEntity {
	_id: string;
	amenityId: string;
	apartmentId: string;
	residentId?: string;
	startDate: Date;
	endDate: Date;
	startTime?: string; // Formato HH:mm para reservas por horas
	endTime?: string; // Formato HH:mm para reservas por horas
	numberOfHours?: number; // Número de horas agendadas (para POR_HORAS)
	numberOfDays?: number; // Número de dias agendados (para DIARIO)
	status: AmenityBookingStatusEnumType;
	totalValue: number;
	qrCode?: string; // QR code para pagamento (quando aplicável)
	qrCodeExpiry?: Date; // Data de expiração do QR code
	observation?: string; // Observação opcional da reserva
	createdAt: Date;
	updatedAt: Date;
}

export type CreateAmenityBookingEntity = Omit<
	AmenityBookingEntity,
	"_id" | "createdAt" | "updatedAt"
>;

export type UpdateAmenityBookingEntity = Partial<
	Omit<AmenityBookingEntity, "_id" | "createdAt">
>;

