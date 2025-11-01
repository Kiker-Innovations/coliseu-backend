import type { ResidentStatusEnumType } from "../../../v1/enum/residentStatus.enum";

export interface ResidentEntity {
	_id: string;
	name: string;
	apartmentNumber: string;
	email: string;
	passwordHash: string;
	phone: string;
	status: ResidentStatusEnumType;
	photoUrl: string | null;
	residentCode: string;
	createdAt: Date;
	updatedAt: Date;
}

export type CreateResidentEntity = Omit<
	ResidentEntity,
	"_id" | "createdAt" | "updatedAt"
>;

export type UpdateResidentEntity = Partial<
	Pick<ResidentEntity, "name" | "phone" | "photoUrl" | "status" | "updatedAt">
>;
