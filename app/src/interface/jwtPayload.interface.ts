import type { UserTypeEnumType } from "../v1/enum/userType.enum";

export interface JwtPayload {
	userId: string;
	userType: UserTypeEnumType;
	email: string;
	iat?: number;
	exp?: number;
}

