import type { AmenityStatusEnumType } from "@/v1/enum/amenityStatus.enum";

export interface AmenityEntity {
	_id: string;
	buildingId: string;
	name: string;
	quantity: number;
	description?: string;
	type?: "COMODIDADE" | "AREA_COMUM";
	value?: number;
	fineValue?: number;
	maxResidents?: number;
	bookingType?: "DIARIO" | "POR_HORAS";
	maxHours?: number;
	status?: AmenityStatusEnumType;
	createdAt: Date;
	updatedAt: Date;
}

export type CreateAmenityEntity = Omit<
	AmenityEntity,
	"_id" | "createdAt" | "updatedAt"
>;

export type UpdateAmenityEntity = Partial<
	Omit<AmenityEntity, "_id" | "createdAt">
>;

