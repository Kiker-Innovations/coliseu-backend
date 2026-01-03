export const PollStatusEnum = {
    PROGRAMADO: "PROGRAMADO",
    ATIVO: "ATIVO",
    FINALIZADO: "FINALIZADO",
    CANCELADO: "CANCELADO",
} as const;

export type PollStatusEnumType = keyof typeof PollStatusEnum;
