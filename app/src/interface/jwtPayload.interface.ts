import type { UserTypeEnumType } from "../v1/enum/userType.enum";

export interface AccessiblePage {
	title: string;
	url: string;
	icon: string;
	order: number;
}

export interface PagePermissions {
	read: boolean;
	create: boolean;
	update: boolean;
	delete: boolean;
}

export interface JwtPayload {
	userId: string;
	userType: UserTypeEnumType;
	buildingId: string;
	roleId: string;
	planId?: string;
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
	accessiblePages?: AccessiblePage[];
	permissions?: Record<string, PagePermissions>;
	iat?: number;
	exp?: number;
}
