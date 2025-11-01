import { z } from "zod";

export const residentUpdateSchema = z.object({
	name: z
		.string()
		.min(3, "Nome deve ter no mínimo 3 caracteres")
		.max(100, "Nome deve ter no máximo 100 caracteres")
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
