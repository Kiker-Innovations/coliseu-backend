import { z } from "zod";

export const projectSuggestionCreateProjectsSchema = z.object({
  top: z
    .number({ required_error: "Quantidade de projetos é obrigatória" })
    .int("Quantidade de projetos deve ser um número inteiro")
    .min(1, "Quantidade mínima de projetos é 1")
    .max(10, "Quantidade máxima de projetos é 10")
    .default(3),
});

export type ProjectSuggestionCreateProjectsDto = z.infer<
  typeof projectSuggestionCreateProjectsSchema
>;

export const transformProjectSuggestionCreateProjectsDto = (
  data: Partial<ProjectSuggestionCreateProjectsDto>
): ProjectSuggestionCreateProjectsDto => {
  return projectSuggestionCreateProjectsSchema.parse(data);
};
