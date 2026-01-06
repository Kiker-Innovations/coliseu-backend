export const AdminStatusEnum = {
	INATIVO: "INATIVO",
	ATIVO: "ATIVO",
} as const;

export type AdminStatusEnumType = keyof typeof AdminStatusEnum;
