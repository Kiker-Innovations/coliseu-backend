export const AmenityTypeEnum = {
	COMODIDADE: "COMODIDADE",
	AREA_COMUM: "AREA_COMUM",
} as const;

export type AmenityTypeEnumType =
	(typeof AmenityTypeEnum)[keyof typeof AmenityTypeEnum];

export const AmenityTypeEnumValues = Object.values(AmenityTypeEnum) as [
	string,
	...string[],
];
