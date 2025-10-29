import { z } from "zod";

export const residentCreateSchema = z.object({
	apartmentNumber: z
		.string({ required_error: "Número do apartamento é obrigatório" })
		.min(1, "Número do apartamento não pode ser vazio")
		.max(4, "Número do apartamento deve ter no máximo 4 dígitos")
		.refine(
			(val) => /^\d+$/.test(val),
			"Número do apartamento deve conter apenas dígitos numéricos",
		),
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
	phone: z
		.string({ required_error: "Telefone é obrigatório" })
		.regex(
			/^\+\d{11,15}$/,
			"Telefone deve estar no formato internacional (ex: +5511999999999)",
		),
});

export type ResidentCreateDto = z.infer<typeof residentCreateSchema>;

export const transformCreateResidentDto = (
	data: ResidentCreateDto,
): ResidentCreateDto => {
	return residentCreateSchema.parse(data);
};
