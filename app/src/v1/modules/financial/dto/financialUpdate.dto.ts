import { z } from "zod";

export const financialUpdateSchema = z.object({
  condominiumFund: z
    .number()
    .min(0, "O caixa deve ser um valor positivo")
    .optional(),
});

export type FinancialUpdateDto = z.infer<typeof financialUpdateSchema>;

export const transformFinancialUpdateDto = (
  body: unknown
): FinancialUpdateDto => {
  return financialUpdateSchema.parse(body);
};
