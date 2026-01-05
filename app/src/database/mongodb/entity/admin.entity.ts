export interface AdminEntity {
	_id: string;
	buildingId: string;
	email: string;
	passwordHash: string;
	name: string;
	phone?: string;
	photoUrl?: string | null;
	status: string;
	adminCode?: string;
	resetPasswordToken?: string;
	resetPasswordTokenExpiry?: Date;
	createdAt: Date;
	updatedAt: Date;
}

export type CreateAdminEntity = Omit<
	AdminEntity,
	"_id" | "createdAt" | "updatedAt"
>;

export type UpdateAdminEntity = Partial<
	Omit<AdminEntity, "_id" | "createdAt">
>;

