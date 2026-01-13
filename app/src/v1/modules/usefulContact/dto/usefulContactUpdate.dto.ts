import { z } from "zod";

export const usefulContactUpdateSchema = z.object({
	name: z
		.string()
		.min(2, "Nome deve ter no mínimo 2 caracteres")
		.max(100, "Nome deve ter no máximo 100 caracteres")
		.optional(),
	phone: z
		.string()
		.min(10, "Telefone deve ter no mínimo 10 caracteres")
		.max(20, "Telefone deve ter no máximo 20 caracteres")
		.optional(),
	observation: z
		.string()
		.max(500, "Observação deve ter no máximo 500 caracteres")
		.optional(),
});

export type UsefulContactUpdateDto = z.infer<typeof usefulContactUpdateSchema>;

export const transformUsefulContactUpdateDto = (
	data: unknown,
): UsefulContactUpdateDto => {
	return usefulContactUpdateSchema.parse(data);
};

