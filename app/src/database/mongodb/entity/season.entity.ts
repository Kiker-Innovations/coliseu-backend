export type RankingStatus = "idle" | "in_progress" | "done" | "error";

export interface SeasonEntity {
	_id: string;
	buildingId: string;
	seasonNumber: number;
	reusedSuggestions: boolean;
	rankingStatus: RankingStatus | null;
	createdAt: Date;
	updatedAt: Date;
	endDate: Date | null;
}

export type CreateSeasonEntity = Omit<
	SeasonEntity,
	"_id" | "createdAt" | "updatedAt" | "endDate" | "seasonNumber" | "rankingStatus"
>;

export type UpdateSeasonEntity = Partial<
	Pick<SeasonEntity, "reusedSuggestions" | "rankingStatus" | "updatedAt">
>;
