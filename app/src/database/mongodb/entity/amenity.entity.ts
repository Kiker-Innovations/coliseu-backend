import type { AmenityStatusEnumType } from "@/v1/enum/amenityStatus.enum";
import type { AmenityTypeEnumType } from "@/v1/enum/amenityType.enum";
import type { AmenityBookingTypeEnumType } from "@/v1/enum/amenityBookingType.enum";

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
	usageRules?: string; // HTML content for rich text
	bookingType?: AmenityBookingTypeEnumType;
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
