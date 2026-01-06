export interface FineEntity {
	_id: string;
	buildingId: string;
	name: string;
	description: string;
	value: number;
	createdAt: Date;
	updatedAt: Date;
}

export type CreateFineEntity = Omit<
	FineEntity,
	"_id" | "createdAt" | "updatedAt"
>;

export type UpdateFineEntity = Partial<Omit<FineEntity, "_id" | "createdAt">>;
