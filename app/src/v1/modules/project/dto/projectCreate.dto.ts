import { z } from "zod";

export const projectCreateSchema = z.object({
	title: z
		.string({
			required_error: "Campo title é obrigatório",
		})
		.min(3, "O título deve ter pelo menos 3 caracteres")
		.max(100, "O título deve ter no máximo 100 caracteres"),
	description: z
		.string({
			required_error: "Campo description é obrigatório",
		})
		.min(10, "A descrição deve ter pelo menos 10 caracteres")
		.max(1000, "A descrição deve ter no máximo 1000 caracteres"),
});

export type ProjectCreateDto = z.infer<typeof projectCreateSchema>;

export const transformCreateProjectDto = (
	data: ProjectCreateDto,
): ProjectCreateDto => {
	return projectCreateSchema.parse(data);
};
