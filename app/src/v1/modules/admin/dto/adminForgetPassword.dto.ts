import { z } from "zod";

export const adminForgetPasswordSchema = z.object({
	email: z
		.string({ required_error: "Email é obrigatório" })
		.email("Email deve ser válido"),
});

export type AdminForgetPasswordDto = z.infer<typeof adminForgetPasswordSchema>;

export const transformForgetPasswordAdminDto = (
	data: AdminForgetPasswordDto,
): AdminForgetPasswordDto => {
	return adminForgetPasswordSchema.parse(data);
};

