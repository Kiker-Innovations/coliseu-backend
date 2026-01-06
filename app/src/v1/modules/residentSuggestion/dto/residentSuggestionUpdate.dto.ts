import { z } from "zod";

export const residentSuggestionUpdateSchema = z.object({
	title: z
		.string()
		.min(3, "Título deve ter no mínimo 3 caracteres")
		.max(100, "Título deve ter no máximo 100 caracteres")
		.trim()
		.optional(),
	description: z
		.string()
		.min(10, "Descrição deve ter no mínimo 10 caracteres")
		.max(1000, "Descrição deve ter no máximo 1000 caracteres")
		.trim()
		.optional(),
});

export type ResidentSuggestionUpdateDto = z.infer<
	typeof residentSuggestionUpdateSchema
>;

export const transformUpdateResidentSuggestionDto = (
	data: ResidentSuggestionUpdateDto,
): ResidentSuggestionUpdateDto => {
	return residentSuggestionUpdateSchema.parse(data);
};
