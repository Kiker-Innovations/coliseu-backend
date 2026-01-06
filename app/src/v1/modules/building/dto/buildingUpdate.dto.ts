import { z } from "zod";

export const buildingUpdateSchema = z.object({
	name: z
		.string()
		.min(3, "Nome deve ter no mínimo 3 caracteres")
		.max(100, "Nome deve ter no máximo 100 caracteres")
		.trim()
		.optional(),
	cnpj: z
		.string()
		.regex(
			/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
			"CNPJ deve estar no formato 00.000.000/0000-00",
		)
		.optional(),
	state: z
		.string()
		.length(2, "Estado deve ter 2 caracteres (UF)")
		.toUpperCase()
		.optional(),
	city: z
		.string()
		.min(2, "Cidade deve ter no mínimo 2 caracteres")
		.max(100, "Cidade deve ter no máximo 100 caracteres")
		.trim()
		.optional(),
	address: z
		.string()
		.min(3, "Endereço deve ter no mínimo 3 caracteres")
		.max(200, "Endereço deve ter no máximo 200 caracteres")
		.trim()
		.optional(),
	addressNumber: z
		.number()
		.int("Número deve ser um valor inteiro")
		.positive("Número deve ser positivo")
		.optional(),
	zipCode: z
		.string()
		.regex(/^\d{5}-\d{3}$/, "CEP deve estar no formato 00000-000")
		.optional(),
	complement: z
		.string()
		.max(100, "Complemento deve ter no máximo 100 caracteres")
		.trim()
		.optional(),
	phone: z
		.string()
		.regex(
			/^\(\d{2}\) \d{4,5}-\d{4}$/,
			"Telefone deve estar no formato (00) 00000-0000",
		)
		.optional(),
	floorCount: z
		.number()
		.int("Número de andares deve ser um valor inteiro")
		.positive("Número de andares deve ser positivo")
		.optional(),
});

export type BuildingUpdateDto = z.infer<typeof buildingUpdateSchema>;

export const transformUpdateBuildingDto = (
	data: BuildingUpdateDto,
): BuildingUpdateDto => {
	return buildingUpdateSchema.parse(data);
};
