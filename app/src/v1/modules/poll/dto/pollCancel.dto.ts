import { z } from "zod";

export const pollCancelSchema = z.object({
	cancelReason: z
		.string({ required_error: "Motivo do cancelamento é obrigatório" })
		.min(3, "Motivo do cancelamento deve ter no mínimo 3 caracteres")
		.max(500, "Motivo do cancelamento deve ter no máximo 500 caracteres"),
});

export type PollCancelDto = z.infer<typeof pollCancelSchema>;

export const transformCancelPollDto = (
	data: PollCancelDto,
): PollCancelDto => {
	return pollCancelSchema.parse(data);
};

