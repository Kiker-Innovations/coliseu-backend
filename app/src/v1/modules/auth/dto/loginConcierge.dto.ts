import { z } from "zod";

const loginConciergeSchema = z.object({
	email: z.string().email("Email inválido"),
	password: z.string().min(1, "Senha é obrigatória"),
});

export type LoginConciergeDto = z.infer<typeof loginConciergeSchema>;

export function transformLoginConciergeDto(data: unknown): LoginConciergeDto {
	return loginConciergeSchema.parse(data);
}

