export const AmenityStatusEnum = {
	ATIVO: "ATIVO",
	INATIVO: "INATIVO",
} as const;

export type AmenityStatusEnumType =
	(typeof AmenityStatusEnum)[keyof typeof AmenityStatusEnum];

export const AmenityStatusEnumValues = Object.values(AmenityStatusEnum) as [
	string,
	...string[],
];
