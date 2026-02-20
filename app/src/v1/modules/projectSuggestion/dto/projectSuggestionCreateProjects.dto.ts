import { z } from "zod";

export const projectSuggestionCreateProjectsSchema = z.object({
	suggestionIds: z
		.array(
			z.string({ required_error: "ID da sugestão é obrigatório" }).uuid("ID da sugestão deve ser um UUID válido"),
		)
		.min(1, "Selecione pelo menos 1 sugestão para criar projeto")
		.max(10, "Máximo de 10 projetos por vez"),
});

export type ProjectSuggestionCreateProjectsDto = z.infer<
	typeof projectSuggestionCreateProjectsSchema
>;

export const transformProjectSuggestionCreateProjectsDto = (
	data: Partial<ProjectSuggestionCreateProjectsDto>,
): ProjectSuggestionCreateProjectsDto => {
	return projectSuggestionCreateProjectsSchema.parse(data);
};
