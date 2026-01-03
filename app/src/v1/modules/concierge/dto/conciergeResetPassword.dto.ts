import { z } from "zod";

export const conciergeResetPasswordSchema = z.object({
	email: z
		.string({ required_error: "Email é obrigatório" })
		.email("Email deve ser válido"),
	code: z
		.string({ required_error: "Código de recuperação é obrigatório" })
		.length(6, "Código deve ter 6 caracteres"),
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
});

export type ConciergeResetPasswordDto = z.infer<
	typeof conciergeResetPasswordSchema
>;

export const transformResetPasswordConciergeDto = (
	data: ConciergeResetPasswordDto,
): ConciergeResetPasswordDto => {
	return conciergeResetPasswordSchema.parse(data);
};
