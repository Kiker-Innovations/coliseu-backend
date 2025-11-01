export interface AdminEntity {
	_id: string;
	email: string;
	passwordHash: string;
	name: string;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export type CreateAdminEntity = Omit<
	AdminEntity,
	"_id" | "createdAt" | "updatedAt"
>;

export type UpdateAdminEntity = Partial<
	Pick<AdminEntity, "name" | "isActive" | "updatedAt">
>;

