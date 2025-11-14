export interface SuggestionEntity {
	_id: string;
	residentId: string;
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

