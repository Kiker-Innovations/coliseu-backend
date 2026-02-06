import { z } from "zod";

export const usefulContactCreateSchema = z.object({
	name: z
		.string({ required_error: "Nome é obrigatório" })
		.min(2, "Nome deve ter no mínimo 2 caracteres")
		.max(100, "Nome deve ter no máximo 100 caracteres"),
	phone: z
		.string({ required_error: "Telefone é obrigatório" })
		.min(10, "Telefone deve ter no mínimo 10 caracteres")
		.max(20, "Telefone deve ter no máximo 20 caracteres"),
	observation: z
		.string()
		.max(500, "Observação deve ter no máximo 500 caracteres")
		.optional(),
});

export type UsefulContactCreateDto = z.infer<typeof usefulContactCreateSchema>;

export const transformUsefulContactCreateDto = (
	data: unknown,
): UsefulContactCreateDto => {
	return usefulContactCreateSchema.parse(data);
};
