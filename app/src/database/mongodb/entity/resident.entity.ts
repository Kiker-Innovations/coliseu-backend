import type { ResidentStatusEnumType } from "../../../v1/enum/residentStatus.enum";
import type { ResidentRejectTypeEnumType } from "../../../v1/enum/residentRejectType.enum";
import type { ResidentInactiveTypeEnumType } from "../../../v1/enum/residentInactiveType.enum";

export interface ResidentEntity {
	_id: string;
	name: string;
	buildingId: string;
	apartmentId: string;
	roleId: string;
	email: string;
	passwordHash: string;
	phone: string;
	status: ResidentStatusEnumType;
	photoUrl: string | null;
	residentCode: string;
	resetPasswordToken?: string;
	resetPasswordTokenExpiry?: Date;
	rejectType?: ResidentRejectTypeEnumType;
	rejectNote?: string;
	inactiveType?: ResidentInactiveTypeEnumType;
	inactiveNote?: string;
	activatedAt?: Date;
	inactivatedAt?: Date;
	rejectedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

export type CreateResidentEntity = Omit<
	ResidentEntity,
	"_id" | "createdAt" | "updatedAt"
>;

export type UpdateResidentEntity = Partial<
	Pick<
		ResidentEntity,
		| "name"
		| "buildingId"
		| "apartmentId"
		| "phone"
		| "photoUrl"
		| "status"
		| "passwordHash"
		| "resetPasswordToken"
		| "resetPasswordTokenExpiry"
		| "rejectType"
		| "rejectNote"
		| "inactiveType"
		| "inactiveNote"
		| "activatedAt"
		| "inactivatedAt"
		| "rejectedAt"
		| "updatedAt"
	>
>;
