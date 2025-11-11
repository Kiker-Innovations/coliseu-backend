export const ResidentStatusEnum = {
	INATIVO: "INATIVO",
	VALIDADO: "VALIDADO",
	ATIVO: "ATIVO",
} as const;

export type ResidentStatusEnumType = keyof typeof ResidentStatusEnum;
