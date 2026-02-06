export interface UsefulContactEntity {
	_id: string;
	buildingId: string;
	name: string;
	phone: string;
	observation?: string;
	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
}

export type CreateUsefulContactEntity = Omit<
	UsefulContactEntity,
	"_id" | "createdAt" | "updatedAt" | "deletedAt"
>;

export type UpdateUsefulContactEntity = Partial<
	Pick<UsefulContactEntity, "name" | "phone" | "observation" | "updatedAt">
>;
