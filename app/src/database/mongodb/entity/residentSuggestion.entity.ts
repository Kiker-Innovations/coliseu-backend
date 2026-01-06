export interface ResidentSuggestionEntity {
	_id: string;
	apartmentId: string;
	buildingId: string;
	fromSeasonId: string;
	actualSeasonId: string;
	title: string;
	description: string;
	createdAt: Date;
	updatedAt: Date;
}

export type CreateResidentSuggestionEntity = Omit<
	ResidentSuggestionEntity,
	"_id" | "createdAt" | "updatedAt"
>;

export type UpdateResidentSuggestionEntity = Partial<
	Pick<ResidentSuggestionEntity, "title" | "description" | "updatedAt">
>;
