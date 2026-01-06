import { z } from "zod";

export const seasonCreateSchema = z.object({
	reusedSuggestions: z.boolean({
		required_error: "Campo reusedSuggestions é obrigatório",
	}),
});

export type SeasonCreateDto = z.infer<typeof seasonCreateSchema>;

export const transformCreateSeasonDto = (
	data: SeasonCreateDto,
): SeasonCreateDto => {
	return seasonCreateSchema.parse(data);
};
