export const PackageStatusEnum = {
    PENDENTE: "PENDENTE",
    ENTREGUE: "ENTREGUE",
} as const;

export type PackageStatusEnumType = keyof typeof PackageStatusEnum;
