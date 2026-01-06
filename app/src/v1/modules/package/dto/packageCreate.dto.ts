import { z } from "zod";

export const packageCreateSchema = z.object({
	ownerName: z
		.string()
		.min(3, "Nome do destinatário deve ter no mínimo 3 caracteres")
		.max(100, "Nome do destinatário deve ter no máximo 100 caracteres")
		.trim()
		.optional(),
	apartmentId: z
		.string({ required_error: "ID do apartamento é obrigatório" })
		.uuid("ID do apartamento deve ser um UUID válido"),
	description: z
		.string()
		.min(3, "Descrição deve ter no mínimo 3 caracteres")
		.max(500, "Descrição deve ter no máximo 500 caracteres")
		.trim()
		.optional(),
	courierName: z
		.string()
		.min(3, "Nome do entregador deve ter no mínimo 3 caracteres")
		.max(100, "Nome do entregador deve ter no máximo 100 caracteres")
		.trim()
		.optional(),
	receiverDate: z
		.string({ required_error: "Data e hora de chegada é obrigatória" })
		.datetime("Data e hora deve estar no formato ISO 8601")
		.transform((str) => new Date(str)),
});

export type PackageCreateDto = z.infer<typeof packageCreateSchema>;

export const transformCreatePackageDto = (
	data: PackageCreateDto,
): PackageCreateDto => {
	return packageCreateSchema.parse(data);
};
