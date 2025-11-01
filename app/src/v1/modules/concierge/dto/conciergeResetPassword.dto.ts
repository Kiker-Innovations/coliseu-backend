import { z } from "zod";

export const conciergeResetPasswordSchema = z.object({
	token: z
		.string({ required_error: "Token é obrigatório" })
		.min(1, "Token não pode ser vazio"),
	password: z
		.string({ required_error: "Senha é obrigatória" })
		.min(8, "Senha deve ter no mínimo 8 caracteres")
		.refine((val) => /[A-Z]/.test(val), "Senha deve conter pelo menos uma letra maiúscula")
		.refine((val) => /[a-z]/.test(val), "Senha deve conter pelo menos uma letra minúscula")
		.refine(
			(val) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val),
			"Senha deve conter pelo menos um caractere especial",
		),
});

export type ConciergeResetPasswordDto = z.infer<typeof conciergeResetPasswordSchema>;

export const transformResetPasswordConciergeDto = (
	data: ConciergeResetPasswordDto,
): ConciergeResetPasswordDto => {
	return conciergeResetPasswordSchema.parse(data);
};

