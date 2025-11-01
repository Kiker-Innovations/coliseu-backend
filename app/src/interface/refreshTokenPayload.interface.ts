import type { UserTypeEnumType } from "../v1/enum/userType.enum";

export interface RefreshTokenPayload {
	userId: string;
	userType: UserTypeEnumType;
	tokenType: "refresh";
	iat?: number;
	exp?: number;
}

