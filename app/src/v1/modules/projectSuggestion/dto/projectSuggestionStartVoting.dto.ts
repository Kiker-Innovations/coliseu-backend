import { z } from "zod";

export const projectSuggestionStartVotingSchema = z.object({
  votingStartDate: z
    .string({
      required_error: "Campo votingStartDate é obrigatório",
    })
    .datetime(),
  votingEndDate: z
    .string({
      required_error: "Campo votingEndDate é obrigatório",
    })
    .datetime(),
});

export type ProjectSuggestionStartVotingDto = z.infer<
  typeof projectSuggestionStartVotingSchema
>;

export const transformStartVotingDto = (
  data: ProjectSuggestionStartVotingDto
): ProjectSuggestionStartVotingDto => {
  return projectSuggestionStartVotingSchema.parse(data);
};
