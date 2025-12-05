import { z } from "zod";

const offerSchema = z.object({
	companyName: z
		.string({
			required_error: "Nome da empresa obrigatório",
		})
		.min(2, "O nome da empresa deve ter pelo menos 2 caracteres")
		.max(100, "O nome da empresa deve ter no máximo 100 caracteres"),
	description: z
		.string({
			required_error: "Campo de descrição é obrigatório",
		})
		.min(10, "A descrição deve ter pelo menos 10 caracteres")
		.max(1000, "A descrição deve ter no máximo 1000 caracteres"),
	companyCnpj: z
		.string({
			required_error: "Campo CNPJ é obrigatório",
		})
		.regex(
			/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
			"O CNPJ deve estar no formato 00.000.000/0000-00",
		),
	totalValue: z
		.number({
			required_error: "Campo de valor total é obrigatório",
		})
		.positive("O valor total deve ser positivo"),
	installmentsCount: z
		.number({
			required_error: "Campo de parcelas é obrigatório",
		})
		.int("O número de parcelas deve ser um inteiro")
		.min(1, "O número de parcelas deve ser pelo menos 1")
		.max(120, "O número de parcelas deve ser no máximo 120"),
});

export const projectOfferCreateSchema = z.object({
	projectId: z
		.string({
			required_error: "Campo projectId é obrigatório",
		})
		.uuid("projectId deve ser um UUID válido"),
	offerStartDate: z
		.string({
			required_error: "Campo offerStartDate é obrigatório",
		})
		.datetime("offerStartDate deve ser uma data válida"),
	offerEndDate: z
		.string({
			required_error: "Campo offerEndDate é obrigatório",
		})
		.datetime("offerEndDate deve ser uma data válida"),
	offers: z
		.array(offerSchema)
		.min(2, "Deve haver no mínimo 2 ofertas")
		.max(10, "Deve haver no máximo 10 ofertas"),
});

export type ProjectOfferCreateDto = z.infer<typeof projectOfferCreateSchema>;

export const transformCreateProjectOfferDto = (
	data: ProjectOfferCreateDto,
): ProjectOfferCreateDto => {
	return projectOfferCreateSchema.parse(data);
};

