import type { BookingStatusEnumType } from "@/v1/enum/bookingStatus.enum";

export interface BookingEntity {
	_id: string;
	amenityId: string;
	buildingId: string;
	apartmentId: string;
	residentId?: string;
	startDate: Date;
	endDate: Date;
	numberOfDays?: number; // Número de dias agendados (para DIARIO)
	status: BookingStatusEnumType;
	totalValue: number;
	observation?: string; // Observação opcional da reserva
	paymentUrl?: string; // URL de pagamento gerada
	paymentId?: string; // ID do pagamento associado
	createdAt: Date;
	updatedAt: Date;
}

export type CreateBookingEntity = Omit<
	BookingEntity,
	"_id" | "createdAt" | "updatedAt"
>;

export type UpdateBookingEntity = Partial<
	Omit<BookingEntity, "_id" | "createdAt">
>;

