import { z } from "zod";

export const fineUpdateSchema = z.object({
	name: z
		.string({ required_error: "Nome é obrigatório" })
		.min(3, "Nome deve ter no mínimo 3 caracteres")
		.max(200, "Nome deve ter no máximo 200 caracteres")
		.trim()
		.optional(),
	description: z
		.string({ required_error: "Descrição é obrigatória" })
		.min(10, "Descrição deve ter no mínimo 10 caracteres")
		.max(1000, "Descrição deve ter no máximo 1000 caracteres")
		.trim()
		.optional(),
	value: z
		.number({ required_error: "Valor é obrigatório" })
		.positive("Valor deve ser positivo")
		.min(0.01, "Valor deve ser maior que zero")
		.optional(),
});

export type FineUpdateDto = z.infer<typeof fineUpdateSchema>;

export const transformUpdateFineDto = (
	data: FineUpdateDto
): FineUpdateDto => {
	return fineUpdateSchema.parse(data);
};

