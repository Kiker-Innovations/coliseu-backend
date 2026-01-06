import { z } from "zod";

export const documentUpdateSchema = z.object({
	name: z
		.string()
		.min(3, "Nome deve ter no mínimo 3 caracteres")
		.max(200, "Nome deve ter no máximo 200 caracteres")
		.trim()
		.optional(),
	description: z
		.string()
		.min(10, "Descrição deve ter no mínimo 10 caracteres")
		.max(1000, "Descrição deve ter no máximo 1000 caracteres")
		.trim()
		.optional(),
});

export type DocumentUpdateDto = z.infer<typeof documentUpdateSchema>;

export const transformUpdateDocumentDto = (
	data: DocumentUpdateDto,
): DocumentUpdateDto => {
	return documentUpdateSchema.parse(data);
};
