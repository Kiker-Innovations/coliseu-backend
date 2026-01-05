import { z } from "zod";

export const adminUpdateSchema = z.object({
	buildingId: z
		.string()
		.uuid("ID do edifício deve ser um UUID válido")
		.optional(),
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
			"Telefone deve estar no formato internacional (ex: +5511999999999)",
		)
		.optional()
		.nullable(),
	photoUrl: z.string().optional().nullable(),
});

export type AdminUpdateDto = z.infer<typeof adminUpdateSchema>;

export const transformUpdateAdminDto = (data: AdminUpdateDto): AdminUpdateDto => {
	return adminUpdateSchema.parse(data);
};

