import { z } from "zod";

export const adminConfirmSchema = z.object({
	email: z
		.string({ required_error: "Email é obrigatório" })
		.email("Email deve ser válido"),
	code: z
		.string({ required_error: "Código de confirmação é obrigatório" })
		.min(1, "Código de confirmação não pode ser vazio")
		.transform((val) => val.toUpperCase()),
});

export type AdminConfirmDto = z.infer<typeof adminConfirmSchema>;

export const transformConfirmAdminDto = (
	data: AdminConfirmDto,
): AdminConfirmDto => {
	return adminConfirmSchema.parse(data);
};
