import { z } from "zod";

export const recurringExpenseCreateSchema = z.object({
	name: z
		.string()
		.min(3, "O nome deve ter no mínimo 3 caracteres")
		.max(100, "O nome deve ter no máximo 100 caracteres"),
	value: z.number().positive("O valor deve ser positivo"),
});

export type RecurringExpenseCreateDto = z.infer<
	typeof recurringExpenseCreateSchema
>;

export const transformRecurringExpenseCreateDto = (
	body: unknown,
): RecurringExpenseCreateDto => {
	return recurringExpenseCreateSchema.parse(body);
};
