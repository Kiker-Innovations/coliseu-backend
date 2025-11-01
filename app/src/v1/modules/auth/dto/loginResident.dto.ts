import { z } from "zod";

const loginResidentSchema = z.object({
	apartmentNumber: z
		.string()
		.min(1, "Número do apartamento é obrigatório")
		.max(4, "Número do apartamento deve ter no máximo 4 dígitos")
		.regex(/^\d+$/, "Número do apartamento deve conter apenas dígitos"),
	email: z.string().email("Email inválido"),
	password: z.string().min(1, "Senha é obrigatória"),
});

export type LoginResidentDto = z.infer<typeof loginResidentSchema>;

export function transformLoginResidentDto(data: unknown): LoginResidentDto {
	return loginResidentSchema.parse(data);
}

