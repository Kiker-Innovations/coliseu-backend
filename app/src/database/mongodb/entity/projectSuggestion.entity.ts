import type { ProjectSuggestionStatusEnumType } from "@/v1/enum/projectSuggestionStatus.enum";

export interface ProjectSuggestionEntity {
	_id: string;
	buildingId: string;
	seasonId: string;
	title: string;
	description: string;
	duplicateCount: number;
	rank: number;
	votes: number;
	votingStartDate: Date | null;
	votingEndDate: Date | null;
	status: ProjectSuggestionStatusEnumType;
	createdAt: Date;
	updatedAt: Date;
}

export type CreateProjectSuggestionEntity = Omit<
	ProjectSuggestionEntity,
	| "_id"
	| "votes"
	| "votingStartDate"
	| "votingEndDate"
	| "createdAt"
	| "updatedAt"
>;

export type UpdateProjectSuggestionEntity = Partial<
	Pick<
		ProjectSuggestionEntity,
		| "title"
		| "description"
		| "rank"
		| "votes"
		| "votingStartDate"
		| "votingEndDate"
		| "status"
		| "updatedAt"
	>
>;
