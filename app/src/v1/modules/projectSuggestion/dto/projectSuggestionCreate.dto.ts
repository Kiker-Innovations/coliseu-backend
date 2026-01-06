import { z } from "zod";

export const projectSuggestionStartVotingSchema = z.object({
	votingStartDate: z
		.string({
			required_error: "Data e hora de início da votação é obrigatória",
		})
		.refine(
			(val) => !isNaN(Date.parse(val)),
			"Data e hora de início da votação deve ser uma data válida (ISO 8601)",
		),
	votingEndDate: z
		.string({
			required_error: "Data e hora de fim da votação é obrigatória",
		})
		.refine(
			(val) => !isNaN(Date.parse(val)),
			"Data e hora de fim da votação deve ser uma data válida (ISO 8601)",
		),
});

export type ProjectSuggestionStartVotingDto = z.infer<
	typeof projectSuggestionStartVotingSchema
>;

export const transformProjectSuggestionStartVotingDto = (
	data: ProjectSuggestionStartVotingDto,
): ProjectSuggestionStartVotingDto => {
	return projectSuggestionStartVotingSchema.parse(data);
};
