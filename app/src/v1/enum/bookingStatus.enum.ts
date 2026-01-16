export const BookingStatusEnum = {
	PENDENTE: "PENDENTE",
	AGENDADO: "AGENDADO",
	EM_ANDAMENTO: "EM_ANDAMENTO",
	FINALIZADO: "FINALIZADO",
	CANCELADO: "CANCELADO",
} as const;

export type BookingStatusEnumType =
	(typeof BookingStatusEnum)[keyof typeof BookingStatusEnum];

export const BookingStatusEnumValues = Object.values(
	BookingStatusEnum,
) as [string, ...string[]];

