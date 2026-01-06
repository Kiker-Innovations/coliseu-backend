export const InfractionTypeEnum = {
	MULTA: "MULTA",
	NOTIFICACAO: "NOTIFICACAO",
} as const;

export type InfractionTypeEnumType =
	(typeof InfractionTypeEnum)[keyof typeof InfractionTypeEnum];

export const InfractionTypeEnumValues = Object.values(InfractionTypeEnum) as [
	string,
	...string[],
];
