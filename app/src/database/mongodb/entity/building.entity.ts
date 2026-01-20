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
	logoUrl?: string | null;
	bannerUrl?: string | null;
	coverUrl?: string | null;
	mainColor?: string | null;
	secondaryColor?: string | null;
	tertiaryColor?: string | null;
	planId: string;
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
