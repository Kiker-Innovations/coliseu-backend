import { z } from "zod";

export const fineCreateSchema = z.object({
	buildingId: z
		.string({ required_error: "ID do edifício é obrigatório" })
		.uuid("ID do edifício deve ser um UUID válido"),
	name: z
		.string({ required_error: "Nome é obrigatório" })
		.min(3, "Nome deve ter no mínimo 3 caracteres")
		.max(200, "Nome deve ter no máximo 200 caracteres")
		.trim(),
	description: z
		.string({ required_error: "Descrição é obrigatória" })
		.min(10, "Descrição deve ter no mínimo 10 caracteres")
		.max(1000, "Descrição deve ter no máximo 1000 caracteres")
		.trim(),
	value: z
		.number({ required_error: "Valor é obrigatório" })
		.positive("Valor deve ser positivo")
		.min(0.01, "Valor deve ser maior que zero"),
});

export type FineCreateDto = z.infer<typeof fineCreateSchema>;

export const transformCreateFineDto = (data: FineCreateDto): FineCreateDto => {
	return fineCreateSchema.parse(data);
};
