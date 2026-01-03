import { z } from "zod";

export const oneTimeExpenseCreateSchema = z.object({
  name: z
    .string()
    .min(3, "O nome deve ter no mínimo 3 caracteres")
    .max(100, "O nome deve ter no máximo 100 caracteres"),
  description: z
    .string()
    .min(10, "A descrição deve ter no mínimo 10 caracteres")
    .max(500, "A descrição deve ter no máximo 500 caracteres"),
  value: z.number().positive("O valor deve ser positivo"),
  receiptImageUrl: z.string().url().optional(),
});

export type OneTimeExpenseCreateDto = z.infer<
  typeof oneTimeExpenseCreateSchema
>;

export const transformOneTimeExpenseCreateDto = (
  body: unknown
): OneTimeExpenseCreateDto => {
  return oneTimeExpenseCreateSchema.parse(body);
};
