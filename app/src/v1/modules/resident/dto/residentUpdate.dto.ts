import { z } from "zod";

export const residentUpdateSchema = z.object({
	name: z
		.string()
		.min(3, "Nome deve ter no mínimo 3 caracteres")
		.max(100, "Nome deve ter no máximo 100 caracteres")
		.trim()
		.optional(),
	buildingId: z
		.string()
		.uuid("ID do edifício deve ser um UUID válido")
		.optional(),
	apartmentNumber: z
		.string()
		.min(1, "Número do apartamento não pode ser vazio")
		.max(10, "Número do apartamento deve ter no máximo 10 caracteres")
		.trim()
		.optional(),
	blockName: z
		.string()
		.min(1, "Nome do bloco não pode ser vazio")
		.max(50, "Nome do bloco deve ter no máximo 50 caracteres")
		.trim()
		.optional(),
	phone: z
		.string()
		.regex(
			/^\+\d{11,15}$/,
			"Telefone deve estar no formato internacional (ex: +5513974080222)",
		)
		.optional(),
});

export type ResidentUpdateDto = z.infer<typeof residentUpdateSchema>;

export const transformUpdateResidentDto = (
	data: ResidentUpdateDto,
): ResidentUpdateDto => {
	return residentUpdateSchema.parse(data);
};
