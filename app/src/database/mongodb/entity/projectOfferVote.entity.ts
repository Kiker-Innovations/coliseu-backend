export interface ProjectOfferVoteEntity {
  _id: string;
  buildingId: string;
  seasonId: string;
  projectId: string;
  projectOfferId: string;
  residentId: string;
  apartmentId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateProjectOfferVoteEntity = Omit<
  ProjectOfferVoteEntity,
  "_id" | "createdAt" | "updatedAt"
>;

export type UpdateProjectOfferVoteEntity = Partial<
  Pick<ProjectOfferVoteEntity, "projectOfferId" | "updatedAt">
>;
