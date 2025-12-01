import { z } from "zod";

export const seasonUpdateSchema = z.object({
	reusedSuggestions: z.boolean().optional(),
});

export type SeasonUpdateDto = z.infer<typeof seasonUpdateSchema>;

export const transformUpdateSeasonDto = (
	data: SeasonUpdateDto,
): SeasonUpdateDto => {
	return seasonUpdateSchema.parse(data);
};

