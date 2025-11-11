export const ConciergeStatusEnum = {
    INATIVO: "INATIVO",
    ATIVO: "ATIVO",
    DE_FERIAS: "DE FERIAS",
} as const;

export type ConciergeStatusEnumType = keyof typeof ConciergeStatusEnum;
