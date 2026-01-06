import { z } from "zod";

export const buildingCreateSchema = z.object({
	name: z
		.string({ required_error: "Nome é obrigatório" })
		.min(3, "Nome deve ter no mínimo 3 caracteres")
		.max(100, "Nome deve ter no máximo 100 caracteres")
		.trim(),
	cnpj: z
		.string({ required_error: "CNPJ é obrigatório" })
		.regex(
			/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
			"CNPJ deve estar no formato 00.000.000/0000-00",
		),
	state: z
		.string({ required_error: "Estado é obrigatório" })
		.length(2, "Estado deve ter 2 caracteres (UF)")
		.toUpperCase(),
	city: z
		.string({ required_error: "Cidade é obrigatória" })
		.min(2, "Cidade deve ter no mínimo 2 caracteres")
		.max(100, "Cidade deve ter no máximo 100 caracteres")
		.trim(),
	address: z
		.string({ required_error: "Endereço é obrigatório" })
		.min(3, "Endereço deve ter no mínimo 3 caracteres")
		.max(200, "Endereço deve ter no máximo 200 caracteres")
		.trim(),
	addressNumber: z
		.number({ required_error: "Número do endereço é obrigatório" })
		.int("Número deve ser um valor inteiro")
		.positive("Número deve ser positivo"),
	zipCode: z
		.string({ required_error: "CEP é obrigatório" })
		.regex(/^\d{5}-\d{3}$/, "CEP deve estar no formato 00000-000"),
	complement: z
		.string()
		.max(100, "Complemento deve ter no máximo 100 caracteres")
		.trim()
		.default(""),
	phone: z
		.string({ required_error: "Telefone é obrigatório" })
		.regex(
			/^\(\d{2}\) \d{4,5}-\d{4}$/,
			"Telefone deve estar no formato (00) 00000-0000",
		),
	floorCount: z
		.number({ required_error: "Número de andares é obrigatório" })
		.int("Número de andares deve ser um valor inteiro")
		.positive("Número de andares deve ser positivo"),
});

export type BuildingCreateDto = z.infer<typeof buildingCreateSchema>;

export const transformCreateBuildingDto = (
	data: BuildingCreateDto,
): BuildingCreateDto => {
	return buildingCreateSchema.parse(data);
};
