export const FineStatusEnum = {
	PENDENTE: "PENDENTE",
	EM_REVISAO: "EM_REVISAO",
	PAGO: "PAGO",
	CANCELADA: "CANCELADA",
} as const;

export type FineStatusEnumType =
	(typeof FineStatusEnum)[keyof typeof FineStatusEnum];

export const FineStatusEnumValues = Object.values(FineStatusEnum) as [
	string,
	...string[],
];
