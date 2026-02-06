export type PaymentType = "BOOKING";
export type PaymentStatus =
	| "PENDENTE"
	| "PAGO"
	| "CANCELADO"
	| "EXPIRADO"
	| "ERROR";
export type PaymentMethod = "PIX" | "BOLETO" | "CARD";

export interface PaymentEntity {
	_id: string;
	paymentOriginId: string;
	entityOriginId: string;
	paymentUrl: string;
	platformFee: number;
	method: PaymentMethod;
	type: PaymentType;
	gateway: string;
	value: number;
	residentId: string;
	apartmentId: string;
	buildingId: string;
	status: PaymentStatus;
	error?: string;
	createdAt: Date;
	updatedAt: Date;
	paidAt: Date;
	canceledAt?: Date;
	expiresAt: Date;
}

export type CreatePaymentEntity = Omit<
	PaymentEntity,
	"_id" | "createdAt" | "updatedAt"
>;

export type UpdatePaymentEntity = Partial<
	Pick<
		PaymentEntity,
		| "status"
		| "error"
		| "paymentUrl"
		| "paymentOriginId"
		| "paidAt"
		| "canceledAt"
		| "expiresAt"
		| "updatedAt"
	>
>;
