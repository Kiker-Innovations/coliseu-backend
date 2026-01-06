import { z } from "zod";

/**
 * DTO para adicionar uma entrada de caixa
 * O síndico pode cadastrar múltiplas entradas, cada uma com título e valor
 */
export const financialCreateSchema = z.object({
	title: z
		.string()
		.min(3, "O título deve ter pelo menos 3 caracteres")
		.max(100, "O título deve ter no máximo 100 caracteres"),
	value: z.number().min(0.01, "O valor deve ser maior que zero"),
});

export type FinancialCreateDto = z.infer<typeof financialCreateSchema>;

export const transformFinancialCreateDto = (
	body: unknown,
): FinancialCreateDto => {
	return financialCreateSchema.parse(body);
};
