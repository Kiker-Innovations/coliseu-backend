import { z } from "zod";

export const oneTimeExpenseUpdateSchema = z.object({
	name: z
		.string()
		.min(3, "O nome deve ter no mínimo 3 caracteres")
		.max(100, "O nome deve ter no máximo 100 caracteres")
		.optional(),
	description: z
		.string()
		.min(10, "A descrição deve ter no mínimo 10 caracteres")
		.max(500, "A descrição deve ter no máximo 500 caracteres")
		.optional(),
	value: z.number().positive("O valor deve ser positivo").optional(),
	receiptImageUrl: z.string().url().optional(),
});

export type OneTimeExpenseUpdateDto = z.infer<
	typeof oneTimeExpenseUpdateSchema
>;

export const transformOneTimeExpenseUpdateDto = (
	body: unknown,
): OneTimeExpenseUpdateDto => {
	return oneTimeExpenseUpdateSchema.parse(body);
};
