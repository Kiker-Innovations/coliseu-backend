export interface ProjectSuggestionEntity {
  _id: string;
  buildingId: string;
  seasonId: string;
  title: string;
  description: string;
  duplicateCount: number;
  rank: number;
  votes: number;
  votingStartDate?: Date;
  votingEndDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateProjectSuggestionEntity = Omit<
  ProjectSuggestionEntity,
  "_id" | "votes" | "createdAt" | "updatedAt"
>;

export type UpdateProjectSuggestionEntity = Partial<
  Pick<
    ProjectSuggestionEntity,
    | "title"
    | "description"
    | "votes"
    | "votingStartDate"
    | "votingEndDate"
    | "updatedAt"
  >
>;
