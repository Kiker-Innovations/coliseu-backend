import { z } from "zod";

export const projectUpdateSchema = z.object({
	title: z
		.string()
		.min(3, "O título deve ter pelo menos 3 caracteres")
		.max(100, "O título deve ter no máximo 100 caracteres")
		.optional(),
	description: z
		.string()
		.min(10, "A descrição deve ter pelo menos 10 caracteres")
		.max(1000, "A descrição deve ter no máximo 1000 caracteres")
		.optional(),
});

export type ProjectUpdateDto = z.infer<typeof projectUpdateSchema>;

export const transformUpdateProjectDto = (
	data: ProjectUpdateDto,
): ProjectUpdateDto => {
	return projectUpdateSchema.parse(data);
};
