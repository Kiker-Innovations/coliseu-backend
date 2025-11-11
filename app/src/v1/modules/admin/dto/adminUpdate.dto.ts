import { z } from "zod";

export const adminUpdateSchema = z.object({
	name: z
		.string()
		.min(3, "Nome deve ter no mínimo 3 caracteres")
		.max(100, "Nome deve ter no máximo 100 caracteres")
		.trim()
		.optional(),
});

export type AdminUpdateDto = z.infer<typeof adminUpdateSchema>;

export const transformUpdateAdminDto = (data: AdminUpdateDto): AdminUpdateDto => {
	return adminUpdateSchema.parse(data);
};

