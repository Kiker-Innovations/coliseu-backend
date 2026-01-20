import type { AmenityStatusEnumType } from "@/v1/enum/amenityStatus.enum";
import type { AmenityTypeEnumType } from "@/v1/enum/amenityType.enum";
import type { BookingTypeEnumType } from "@/v1/enum/bookingType.enum";

export interface AmenityItem {
	name: string;
	quantity: number;
}

export interface AmenityEntity {
	_id: string;
	buildingId: string;
	name: string;
	description?: string;
	type?: AmenityTypeEnumType;
	value?: number;
	fineValue?: number;
	nonComplianceFine?: number;
	maxResidents?: number;
	maxHours?: number;
	usageRules?: string; 
	bookingType?: BookingTypeEnumType;
	status?: AmenityStatusEnumType;
	openingTime?: string; // HH:mm format (e.g., "08:00")
	closingTime?: string; // HH:mm format (e.g., "22:00")
	items?: AmenityItem[]; // Lista de itens da comodidade
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
