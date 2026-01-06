import { z } from "zod";

export const residentListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).optional().default(1),
	limit: z.coerce.number().int().min(1).max(100).optional().default(10),
	search: z.string().optional(),
	filterBy: z.enum(["name", "phone", "email", "apartment"]).optional(),
	status: z
		.enum([
			"A_CONFIRMACAO_EMAIL",
			"A_VALIDACAO",
			"REJEITADO",
			"INATIVO",
			"ATIVO",
		])
		.optional(),
});

export type ResidentListQueryDto = z.infer<typeof residentListQuerySchema>;

export const transformResidentListQueryDto = (
	query: any,
): ResidentListQueryDto => {
	return residentListQuerySchema.parse(query);
};
