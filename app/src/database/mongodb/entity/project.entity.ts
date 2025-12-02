export interface ProjectEntity {
	_id: string;
	buildingId: string;
	fromSeasonId: string;
    chosenOfferId?: string;
	title: string;
	description: string;
	createdAt: Date;
	updatedAt: Date;
}

export type CreateProjectEntity = Omit<
	ProjectEntity,
	"_id" | "createdAt" | "updatedAt"
>;

export type UpdateProjectEntity = Partial<
	Pick<ProjectEntity, "title" | "description" | "updatedAt">
>;

