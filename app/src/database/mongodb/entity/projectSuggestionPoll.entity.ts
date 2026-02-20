export interface ProjectSuggestionPollEntity {
	_id: string;
	projectSuggestionId: string;
	residentId: string;
	apartmentId: string;
	voteCount: number;
	createdAt: Date;
	updatedAt: Date;
}

export type CreateProjectSuggestionPollEntity = Omit<
	ProjectSuggestionPollEntity,
	"_id" | "createdAt" | "updatedAt"
>;

export type UpdateProjectSuggestionPollEntity = Partial<
	Pick<ProjectSuggestionPollEntity, "voteCount" | "updatedAt">
>;
