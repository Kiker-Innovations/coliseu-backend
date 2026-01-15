export const BookingTypeEnum = {
	DIARIO: "DIARIO",
	POR_HORAS: "POR_HORAS",
} as const;

export type BookingTypeEnumType =
	(typeof BookingTypeEnum)[keyof typeof BookingTypeEnum];

export const BookingTypeEnumValues = Object.values(
	BookingTypeEnum,
) as [string, ...string[]];

