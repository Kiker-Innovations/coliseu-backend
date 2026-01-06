export const UserTypeEnum = {
	RESIDENT: "resident",
	CONCIERGE: "concierge",
	ADMIN: "admin",
} as const;

export type UserTypeEnumType = (typeof UserTypeEnum)[keyof typeof UserTypeEnum];
