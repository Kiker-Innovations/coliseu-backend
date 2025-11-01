export const ConciergeStatusEnum = {
    INATIVO: "INATIVO",
    VALIDADO: "VALIDADO",
    ATIVO: "ATIVO",
    DE_FERIAS: "DE FERIAS",
} as const;

export type ConciergeStatusEnumType = keyof typeof ConciergeStatusEnum;
