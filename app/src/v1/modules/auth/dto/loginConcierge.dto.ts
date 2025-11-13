import { z } from "zod";

const loginConciergeSchema = z.object({
	buildingId: z
		.string({ required_error: "ID do edifício é obrigatório" })
		.uuid("ID do edifício deve ser um UUID válido"),
	email: z.string().email("Email inválido"),
	password: z.string().min(1, "Senha é obrigatória"),
});

export type LoginConciergeDto = z.infer<typeof loginConciergeSchema>;

export function transformLoginConciergeDto(data: unknown): LoginConciergeDto {
	return loginConciergeSchema.parse(data);
}

