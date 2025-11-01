import { z } from "zod";

export const conciergeLoginSchema = z.object({
	email: z
		.string({ required_error: "Email é obrigatório" })
		.email("Email deve ser válido"),
	password: z
		.string({ required_error: "Senha é obrigatória" })
		.min(1, "Senha não pode ser vazia"),
});

export type ConciergeLoginDto = z.infer<typeof conciergeLoginSchema>;

export const transformLoginConciergeDto = (
	data: ConciergeLoginDto,
): ConciergeLoginDto => {
	return conciergeLoginSchema.parse(data);
};

