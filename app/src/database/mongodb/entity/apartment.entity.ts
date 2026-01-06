import { ApartmentStatusEnumType } from "@/v1/enum/apartmentStatus.enum";

export interface ApartmentEntity {
	_id: string;
	buildingId: string;
	number: string;
	block: string;
	floor: number;
	status: ApartmentStatusEnumType;
	createdAt: Date;
	updatedAt: Date;
}

export type CreateApartmentEntity = Omit<
	ApartmentEntity,
	"_id" | "createdAt" | "updatedAt"
>;

export type UpdateApartmentEntity = Partial<
	Omit<ApartmentEntity, "_id" | "createdAt">
>;
