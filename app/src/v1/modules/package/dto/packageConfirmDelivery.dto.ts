import { z } from "zod";

export const packageConfirmDeliverySchema = z.object({
	recipientName: z
		.string()
		.min(3, "Nome deve ter no mínimo 3 caracteres")
		.max(100, "Nome deve ter no máximo 100 caracteres")
		.trim()
		.optional(),
	pickupCode: z
		.string({ required_error: "Código de retirada é obrigatório" })
		.min(6, "Código de retirada deve ter no mínimo 6 caracteres")
		.max(6, "Código de retirada deve ter no máximo 6 caracteres")
		.trim()
		.regex(
			/^[A-Z0-9]{6}$/,
			"Código de retirada deve conter apenas letras maiúsculas e números",
		),
});

export type PackageConfirmDeliveryDto = z.infer<
	typeof packageConfirmDeliverySchema
>;

export const transformConfirmDeliveryPackageDto = (
	data: PackageConfirmDeliveryDto,
): PackageConfirmDeliveryDto => {
	return packageConfirmDeliverySchema.parse(data);
};
