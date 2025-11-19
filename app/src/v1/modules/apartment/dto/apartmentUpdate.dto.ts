import { z } from "zod";

export const apartmentUpdateSchema = z.object({
	buildingId: z
		.string()
		.uuid("ID do edifício deve ser um UUID válido")
		.optional(),
	number: z
		.string()
		.min(1, "Número do apartamento não pode ser vazio")
		.max(10, "Número do apartamento deve ter no máximo 10 caracteres")
		.trim()
		.optional(),
	block: z
		.string()
		.min(1, "Bloco não pode ser vazio")
		.max(50, "Bloco deve ter no máximo 50 caracteres")
		.trim()
		.optional(),
	floor: z
		.number()
		.int("Andar deve ser um valor inteiro")
		.min(0, "Andar deve ser maior ou igual a 0")
		.optional(),
	status: z
		.string()
		.min(1, "Status não pode ser vazio")
		.max(50, "Status deve ter no máximo 50 caracteres")
		.trim()
		.optional(),
});

export type ApartmentUpdateDto = z.infer<typeof apartmentUpdateSchema>;

export const transformUpdateApartmentDto = (
	data: ApartmentUpdateDto,
): ApartmentUpdateDto => {
	return apartmentUpdateSchema.parse(data);
};

