export const VehicleTypeEnum = {
	CARRO: "CARRO",
	MOTO: "MOTO",
} as const;

export type VehicleTypeEnumType =
	(typeof VehicleTypeEnum)[keyof typeof VehicleTypeEnum];

export const VehicleTypeEnumValues = Object.values(VehicleTypeEnum);

