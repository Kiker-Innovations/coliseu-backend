import { z } from "zod";

export const suggestionCreateSchema = z.object({
	title: z
		.string({ required_error: "Título é obrigatório" })
		.min(3, "Título deve ter no mínimo 3 caracteres")
		.max(100, "Título deve ter no máximo 100 caracteres")
		.trim(),
	description: z
		.string({ required_error: "Descrição é obrigatória" })
		.min(10, "Descrição deve ter no mínimo 10 caracteres")
		.max(1000, "Descrição deve ter no máximo 1000 caracteres")
		.trim(),
});

export type SuggestionCreateDto = z.infer<typeof suggestionCreateSchema>;

export const transformCreateSuggestionDto = (
	data: SuggestionCreateDto,
): SuggestionCreateDto => {
	return suggestionCreateSchema.parse(data);
};

