export interface SuggestionEntity {
	_id: string;
	apartmentId: string;
	buildingId: string;
	title: string;
	description: string;
	createdAt: Date;
	updatedAt: Date;
}

export type CreateSuggestionEntity = Omit<
	SuggestionEntity,
	"_id" | "createdAt" | "updatedAt"
>;

export type UpdateSuggestionEntity = Partial<
	Pick<SuggestionEntity, "title" | "description" | "updatedAt">
>;

