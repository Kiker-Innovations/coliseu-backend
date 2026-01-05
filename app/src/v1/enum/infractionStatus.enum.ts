export const InfractionStatusEnum = {
	ATIVO: "ATIVO",
	INATIVO: "INATIVO",
} as const;

export type InfractionStatusEnumType =
	typeof InfractionStatusEnum[keyof typeof InfractionStatusEnum];

export const InfractionStatusEnumValues = Object.values(InfractionStatusEnum) as [string, ...string[]];

