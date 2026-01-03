export interface BuildingEntity {
	_id: string;
	name: string;
	cnpj: string;
	state: string;
	city: string;
	address: string;
	addressNumber: number;
	zipCode: string;
	complement: string;
	phone: string;
	floorCount: number;
	createdAt: Date;
	updatedAt: Date;
}

export type CreateBuildingEntity = Omit<
	BuildingEntity,
	"_id" | "createdAt" | "updatedAt"
>;

export type UpdateBuildingEntity = Partial<
	Omit<BuildingEntity, "_id" | "createdAt">
>;

