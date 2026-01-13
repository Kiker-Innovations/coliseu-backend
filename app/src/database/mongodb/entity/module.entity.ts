export interface ModuleEntity {
	_id: string;
	tag: string;
	createdAt: Date;
	updatedAt: Date;
}

export type CreateModuleEntity = Omit<
	ModuleEntity,
	"_id" | "createdAt" | "updatedAt"
>;

export type UpdateModuleEntity = Partial<
	Pick<ModuleEntity, "tag" | "updatedAt">
>;
