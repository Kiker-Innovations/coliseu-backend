export const AmenityBookingStatusEnum = {
	PENDENTE: "PENDENTE",
	CONFIRMADO: "CONFIRMADO",
	EM_ANDAMENTO: "EM_ANDAMENTO",
	FINALIZADO: "FINALIZADO",
	CANCELADO: "CANCELADO",
} as const;

export type AmenityBookingStatusEnumType = typeof AmenityBookingStatusEnum[keyof typeof AmenityBookingStatusEnum];

export const AmenityBookingStatusEnumValues = Object.values(AmenityBookingStatusEnum) as [string, ...string[]];

