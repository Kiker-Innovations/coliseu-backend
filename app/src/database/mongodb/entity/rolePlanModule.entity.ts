export interface RolePlanModuleEntity {
	_id: string;
	roleId: string;
	planId: string;
	moduleId: string;
	read: boolean;
	create: boolean;
	update: boolean;
	delete: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export type CreateRolePlanModuleEntity = Omit<
	RolePlanModuleEntity,
	"_id" | "createdAt" | "updatedAt"
>;

export type UpdateRolePlanModuleEntity = Partial<
	Pick<
		RolePlanModuleEntity,
		"read" | "create" | "update" | "delete" | "updatedAt"
	>
>;
