export const AmenityBookingTypeEnum = {
	DIARIO: "DIARIO",
} as const;

export type AmenityBookingTypeEnumType =
	(typeof AmenityBookingTypeEnum)[keyof typeof AmenityBookingTypeEnum];

export const AmenityBookingTypeEnumValues = Object.values(
	AmenityBookingTypeEnum,
) as [string, ...string[]];
