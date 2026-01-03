import { z } from "zod";

export const conciergeConfirmSchema = z.object({
	email: z
		.string({ required_error: "Email é obrigatório" })
		.email("Email deve ser válido"),
	code: z
		.string({ required_error: "Código de confirmação é obrigatório" })
		.min(1, "Código de confirmação não pode ser vazio")
		.transform((val) => val.toUpperCase()),
});

export type ConciergeConfirmDto = z.infer<typeof conciergeConfirmSchema>;

export const transformConfirmConciergeDto = (
	data: ConciergeConfirmDto,
): ConciergeConfirmDto => {
	return conciergeConfirmSchema.parse(data);
};
