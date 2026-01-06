import { z } from "zod";

export const conciergeForgetPasswordSchema = z.object({
	email: z
		.string({ required_error: "Email é obrigatório" })
		.email("Email deve ser válido"),
});

export type ConciergeForgetPasswordDto = z.infer<
	typeof conciergeForgetPasswordSchema
>;

export const transformForgetPasswordConciergeDto = (
	data: ConciergeForgetPasswordDto,
): ConciergeForgetPasswordDto => {
	return conciergeForgetPasswordSchema.parse(data);
};
