import { z } from "zod";

export const pollVoteSchema = z.object({
	pollId: z
		.string({ required_error: "ID da enquete é obrigatório" })
		.uuid("ID da enquete deve ser um UUID válido"),
	optionId: z
		.number({ required_error: "ID da opção é obrigatório" })
		.int("ID da opção deve ser um número inteiro")
		.min(0, "ID da opção deve ser maior ou igual a 0"),
});

export type PollVoteDto = z.infer<typeof pollVoteSchema>;

export const transformPollVoteDto = (data: PollVoteDto): PollVoteDto => {
	return pollVoteSchema.parse(data);
};

