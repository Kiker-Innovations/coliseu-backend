import { z } from "zod";

export const projectSuggestionPollVoteSchema = z.object({
  projectSuggestionId: z
    .string({
      required_error: "Campo projectSuggestionId é obrigatório",
    })
    .uuid("projectSuggestionId deve ser um UUID válido"),
  voteCount: z
    .number({
      required_error: "Campo voteCount é obrigatório",
    })
    .int()
    .min(1, "Quantidade de votos deve ser pelo menos 1")
    .max(3, "Quantidade de votos não pode exceder 3"),
});

export type ProjectSuggestionPollVoteDto = z.infer<
  typeof projectSuggestionPollVoteSchema
>;

export const transformProjectSuggestionPollVoteDto = (
  data: ProjectSuggestionPollVoteDto
): ProjectSuggestionPollVoteDto => {
  return projectSuggestionPollVoteSchema.parse(data);
};
