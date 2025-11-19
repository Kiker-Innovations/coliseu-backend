import { z } from "zod";

export const residentCreateSchema = z.object({
	name: z
		.string({ required_error: "Nome é obrigatório" })
		.min(3, "Nome deve ter no mínimo 3 caracteres")
		.max(100, "Nome deve ter no máximo 100 caracteres")
		.trim(),
	buildingId: z
		.string({ required_error: "ID do edifício é obrigatório" })
		.uuid("ID do edifício deve ser um UUID válido"),
	apartmentId: z
		.string({ required_error: "ID do apartamento é obrigatório" })
		.uuid("ID do apartamento deve ser um UUID válido"),
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
