import { z } from "zod";

export const residentForgetPasswordSchema = z.object({
	email: z
		.string({ required_error: "Email é obrigatório" })
		.email("Email deve ser válido"),
});

export type ResidentForgetPasswordDto = z.infer<
	typeof residentForgetPasswordSchema
>;

export const transformForgetPasswordResidentDto = (
	data: ResidentForgetPasswordDto,
): ResidentForgetPasswordDto => {
	return residentForgetPasswordSchema.parse(data);
};
