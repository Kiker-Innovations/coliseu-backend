export interface SeasonEntity {
	_id: string;
	buildingId: string;
	seasonNumber: number;
	reusedSuggestions: boolean;
	createdAt: Date;
	updatedAt: Date;
	endDate: Date | null;
}

export type CreateSeasonEntity = Omit<
	SeasonEntity,
	"_id" | "createdAt" | "updatedAt" | "endDate" | "seasonNumber"
>;

export type UpdateSeasonEntity = Partial<
	Pick<SeasonEntity, "reusedSuggestions" | "updatedAt">
>;
