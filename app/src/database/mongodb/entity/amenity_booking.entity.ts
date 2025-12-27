import type { AmenityBookingStatusEnumType } from "@/v1/enum/amenityBookingStatus.enum";

export interface AmenityBookingEntity {
	_id: string;
	amenityId: string;
	apartmentId: string;
	startDate: Date;
	endDate: Date;
	status: AmenityBookingStatusEnumType;
	totalValue: number;
	createdAt: Date;
	updatedAt: Date;
}

export type CreateAmenityBookingEntity = Omit<
	AmenityBookingEntity,
	"_id" | "createdAt" | "updatedAt"
>;

export type UpdateAmenityBookingEntity = Partial<
	Omit<AmenityBookingEntity, "_id" | "createdAt">
>;

