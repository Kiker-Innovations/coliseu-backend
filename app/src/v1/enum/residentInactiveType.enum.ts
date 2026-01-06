export const ResidentInactiveTypeEnum = {
	SOLICITACAO_DO_RESIDENTE: "SOLICITACAO_DO_RESIDENTE",
	VIOLACAO_DE_REGULAMENTO: "VIOLACAO_DE_REGULAMENTO",
	INADIMPLENCIA: "INADIMPLENCIA",
	MUDANCA_DE_ENDERECO: "MUDANCA_DE_ENDERECO",
	OUTRO: "OUTRO",
} as const;

export type ResidentInactiveTypeEnumType =
	keyof typeof ResidentInactiveTypeEnum;
