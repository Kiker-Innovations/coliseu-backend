export interface PlanEntity {
	_id: string;
	name: string;
	description: string;
	price: number;
	createdAt: Date;
	updatedAt: Date;
}

export type CreatePlanEntity = Omit<
	PlanEntity,
	"_id" | "createdAt" | "updatedAt"
>;

export type UpdatePlanEntity = Partial<
	Pick<PlanEntity, "name" | "description" | "price" | "updatedAt">
>;
