import { z } from "zod";

const loginAdminSchema = z.object({
	email: z.string().email("Email inválido"),
	password: z.string().min(1, "Senha é obrigatória"),
});

export type LoginAdminDto = z.infer<typeof loginAdminSchema>;

export function transformLoginAdminDto(data: unknown): LoginAdminDto {
	return loginAdminSchema.parse(data);
}

