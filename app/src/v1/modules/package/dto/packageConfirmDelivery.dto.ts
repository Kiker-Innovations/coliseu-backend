import { z } from "zod";

export const packageConfirmDeliverySchema = z.object({
	recipientName: z
		.string({ required_error: "Nome de quem recebeu é obrigatório" })
		.min(3, "Nome deve ter no mínimo 3 caracteres")
		.max(100, "Nome deve ter no máximo 100 caracteres")
		.trim(),
	deliveryConciergeId: z
		.string({ required_error: "ID do porteiro que registrou a entrega é obrigatório" })
		.uuid("ID do porteiro deve ser um UUID válido"),
});

export type PackageConfirmDeliveryDto = z.infer<typeof packageConfirmDeliverySchema>;

export const transformConfirmDeliveryPackageDto = (
	data: PackageConfirmDeliveryDto,
): PackageConfirmDeliveryDto => {
	return packageConfirmDeliverySchema.parse(data);
};

