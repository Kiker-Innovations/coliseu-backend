import { z } from "zod";

export const adminCreateSchema = z.object({
	name: z
		.string({ required_error: "Nome é obrigatório" })
		.min(3, "Nome deve ter no mínimo 3 caracteres")
		.max(100, "Nome deve ter no máximo 100 caracteres")
		.trim(),
	email: z
		.string({ required_error: "Email é obrigatório" })
		.email("Email deve ser válido"),
	password: z
		.string({ required_error: "Senha é obrigatória" })
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

export type AdminCreateDto = z.infer<typeof adminCreateSchema>;

export const transformCreateAdminDto = (
	data: AdminCreateDto,
): AdminCreateDto => {
	return adminCreateSchema.parse(data);
};

