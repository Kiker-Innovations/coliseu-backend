export interface BuildingPageEntity {
	_id: string;
	buildingId: string;
	pageId: string;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export type CreateBuildingPageEntity = Omit<
	BuildingPageEntity,
	"_id" | "createdAt" | "updatedAt"
>;

export type UpdateBuildingPageEntity = Partial<
	Pick<BuildingPageEntity, "isActive" | "updatedAt">
>;
