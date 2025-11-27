export const ApartmentStatusEnum = {
	DESOCUPADO: "DESOCUPADO",
	OCUPADO: "OCUPADO"
} as const;

export type ApartmentStatusEnumType = keyof typeof ApartmentStatusEnum;

export const ApartmentStatusEnumValues = Object.values(ApartmentStatusEnum);