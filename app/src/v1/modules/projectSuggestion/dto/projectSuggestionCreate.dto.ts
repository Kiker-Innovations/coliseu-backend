import { z } from "zod";

export const projectSuggestionCreateSchema = z.object({
  title: z
    .string({
      required_error: "Campo title é obrigatório",
    })
    .min(3, "Título deve ter pelo menos 3 caracteres")
    .max(100, "Título deve ter no máximo 100 caracteres"),
  description: z
    .string({
      required_error: "Campo description é obrigatório",
    })
    .min(10, "Descrição deve ter pelo menos 10 caracteres")
    .max(1000, "Descrição deve ter no máximo 1000 caracteres"),
  duplicateCount: z.number().int().min(0).default(0),
  rank: z.number().int().min(1),
});

export type ProjectSuggestionCreateDto = z.infer<
  typeof projectSuggestionCreateSchema
>;

export const transformCreateProjectSuggestionDto = (
  data: ProjectSuggestionCreateDto
): ProjectSuggestionCreateDto => {
  return projectSuggestionCreateSchema.parse(data);
};
