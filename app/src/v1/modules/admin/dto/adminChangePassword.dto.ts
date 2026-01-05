import { z } from "zod";

export const adminChangePasswordSchema = z
	.object({
		currentPassword: z
			.string({ required_error: "Senha atual é obrigatória" })
			.min(1, "Senha atual é obrigatória"),
		newPassword: z
			.string({ required_error: "Nova senha é obrigatória" })
			.min(8, "Senha deve ter no mínimo 8 caracteres")
			.refine(
				(val) => /[A-Z]/.test(val),
				"Senha deve conter pelo menos uma letra maiúscula",
			)
			.refine(
				(val) => /[a-z]/.test(val),
				"Senha deve conter pelo menos uma letra minúscula",
			)
			.refine(
				(val) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val),
				"Senha deve conter pelo menos um caractere especial",
			),
		confirmPassword: z
			.string({ required_error: "Confirmação de senha é obrigatória" })
			.min(1, "Confirmação de senha é obrigatória"),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "As senhas não coincidem",
		path: ["confirmPassword"],
	});

export type AdminChangePasswordDto = z.infer<
	typeof adminChangePasswordSchema
>;

export const transformChangePasswordAdminDto = (
	data: AdminChangePasswordDto,
): AdminChangePasswordDto => {
	return adminChangePasswordSchema.parse(data);
};

