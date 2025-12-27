export const ResidentStatusEnum = {
	A_CONFIRMACAO_EMAIL: "A_CONFIRMACAO_EMAIL",
	A_VALIDACAO: "A_VALIDACAO",
	REJEITADO: "REJEITADO",
	ATIVO: "ATIVO",
	INATIVO: "INATIVO",
} as const;

export type ResidentStatusEnumType = keyof typeof ResidentStatusEnum;
