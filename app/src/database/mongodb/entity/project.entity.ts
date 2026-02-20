export interface ProjectEntity {
	_id: string;
	buildingId: string;
	fromSeasonId: string;
	chosenOfferId?: string;
	title: string;
	description: string;
	offerStartDate?: Date;
	offerEndDate?: Date;
	votes: number;
	rank?: number;
	createdAt: Date;
	updatedAt: Date;
}

export type CreateProjectEntity = Omit<
	ProjectEntity,
	| "_id"
	| "chosenOfferId"
	| "offerStartDate"
	| "offerEndDate"
	| "createdAt"
	| "updatedAt"
>;

export type UpdateProjectEntity = Partial<
	Pick<
		ProjectEntity,
		| "title"
		| "description"
		| "chosenOfferId"
		| "offerStartDate"
		| "offerEndDate"
		| "updatedAt"
	>
>;
