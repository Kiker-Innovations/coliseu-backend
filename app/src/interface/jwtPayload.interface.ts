import type { UserTypeEnumType } from "../v1/enum/userType.enum";

export interface JwtPayload {
	userId: string;
	userType: UserTypeEnumType;
	buildingId: string;
	actualSeasonId: string;
	email: string;
	name?: string;
	phone?: string;
	photoUrl?: string | null;
	apartmentId?: string;
	apartmentNumber?: string;
	blockName?: string;
	buildingName?: string;
	shift?: string;
	iat?: number;
	exp?: number;
}

