export const PackageStatusEnum = {
    PENDENTE: "PENDENTE",
    ENTREGUE: "ENTREGUE",
    CANCELADO: "CANCELADO",
} as const;

export type PackageStatusEnumType = keyof typeof PackageStatusEnum;
