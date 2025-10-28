import { z } from "zod";

export const residentUpdateSchema = z.object({
	phone: z
		.string()
		.regex(
			/^\+\d{11,15}$/,
			"Telefone deve estar no formato internacional (ex: +5513974080222)",
		)
		.optional(),
});

export type ResidentUpdateDto = z.infer<typeof residentUpdateSchema>;

export interface IResidentUpdateDto {
	phone?: string;
}
