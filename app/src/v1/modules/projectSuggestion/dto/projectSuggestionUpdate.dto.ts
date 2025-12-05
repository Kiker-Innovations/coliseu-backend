import { z } from "zod";

export const projectSuggestionUpdateSchema = z.object({
  title: z
    .string()
    .min(3, "Título deve ter pelo menos 3 caracteres")
    .max(100, "Título deve ter no máximo 100 caracteres")
    .optional(),
  description: z
    .string()
    .min(10, "Descrição deve ter pelo menos 10 caracteres")
    .max(1000, "Descrição deve ter no máximo 1000 caracteres")
    .optional(),
});

export type ProjectSuggestionUpdateDto = z.infer<
  typeof projectSuggestionUpdateSchema
>;

export const transformUpdateProjectSuggestionDto = (
  data: ProjectSuggestionUpdateDto
): ProjectSuggestionUpdateDto => {
  return projectSuggestionUpdateSchema.parse(data);
};
