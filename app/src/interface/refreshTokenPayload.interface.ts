import type { UserTypeEnumType } from "../v1/enum/userType.enum";

export interface RefreshTokenPayload {
	userId: string;
	actualSeasonId: string;
	userType: UserTypeEnumType;
	buildingId: string;
	tokenType: "refresh";
	iat?: number;
	exp?: number;
}

