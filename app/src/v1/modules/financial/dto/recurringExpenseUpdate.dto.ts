import { z } from "zod";

export const recurringExpenseUpdateSchema = z.object({
  name: z
    .string()
    .min(3, "O nome deve ter no mínimo 3 caracteres")
    .max(100, "O nome deve ter no máximo 100 caracteres")
    .optional(),
  value: z.number().positive("O valor deve ser positivo").optional(),
});

export type RecurringExpenseUpdateDto = z.infer<
  typeof recurringExpenseUpdateSchema
>;

export const transformRecurringExpenseUpdateDto = (
  body: unknown
): RecurringExpenseUpdateDto => {
  return recurringExpenseUpdateSchema.parse(body);
};
