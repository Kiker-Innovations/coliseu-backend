import { z } from "zod";

export const packageCreateSchema = z.object({
	ownerName: z
		.string({ required_error: "Nome do destinatário é obrigatório" })
		.min(3, "Nome do destinatário deve ter no mínimo 3 caracteres")
		.max(100, "Nome do destinatário deve ter no máximo 100 caracteres")
		.trim(),
	apartmentId: z
		.string({ required_error: "ID do apartamento é obrigatório" })
		.uuid("ID do apartamento deve ser um UUID válido"),
	description: z
		.string({ required_error: "Descrição da encomenda é obrigatória" })
		.min(3, "Descrição deve ter no mínimo 3 caracteres")
		.max(500, "Descrição deve ter no máximo 500 caracteres")
		.trim(),
	receiverDate: z
		.string({ required_error: "Data e hora de chegada é obrigatória" })
		.datetime("Data e hora deve estar no formato ISO 8601")
		.transform((str) => new Date(str)),
	receiverConciergeId: z
		.string({ required_error: "ID do porteiro é obrigatório" })
		.uuid("ID do porteiro deve ser um UUID válido"),
});

export type PackageCreateDto = z.infer<typeof packageCreateSchema>;

export const transformCreatePackageDto = (
	data: PackageCreateDto,
): PackageCreateDto => {
	return packageCreateSchema.parse(data);
};

