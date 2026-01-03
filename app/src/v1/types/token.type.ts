import type { UserTypeEnumType } from "../enum/userType.enum";

export interface TokenPayload {
	userId: string;
	userType: UserTypeEnumType;
	buildingId: string;
	email: string;
	name?: string;
	apartmentId?: string;
	apartmentNumber?: string;
	blockName?: string;
	buildingName?: string;
	shift?: string;
}

