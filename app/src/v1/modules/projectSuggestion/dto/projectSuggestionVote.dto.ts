import { z } from "zod";

export const projectSuggestionVoteSchema = z.object({
	projectSuggestionId: z
		.string({ required_error: "ID da sugestão de projeto é obrigatório" })
		.uuid("ID da sugestão de projeto deve ser um UUID válido"),
	voteCount: z
		.number({ required_error: "Quantidade de votos é obrigatória" })
		.int("Quantidade de votos deve ser um número inteiro")
		.min(1, "Quantidade mínima de votos é 1")
		.max(3, "Quantidade máxima de votos é 3"),
});

export type ProjectSuggestionVoteDto = z.infer<
	typeof projectSuggestionVoteSchema
>;

export const transformProjectSuggestionVoteDto = (
	data: ProjectSuggestionVoteDto,
): ProjectSuggestionVoteDto => {
	return projectSuggestionVoteSchema.parse(data);
};
