import { z } from "zod";

const loginResidentSchema = z.object({
	buildingId: z
		.string({ required_error: "ID do edifício é obrigatório" })
		.uuid("ID do edifício deve ser um UUID válido"),
	email: z.string().email("Email inválido"),
	password: z.string().min(1, "Senha é obrigatória"),
});

export type LoginResidentDto = z.infer<typeof loginResidentSchema>;

export function transformLoginResidentDto(data: unknown): LoginResidentDto {
	return loginResidentSchema.parse(data);
}
