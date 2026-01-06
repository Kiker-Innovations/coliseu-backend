import { z } from "zod";

export const packageConfirmDeliverySchema = z.object({
	recipientName: z
		.string()
		.min(3, "Nome deve ter no mínimo 3 caracteres")
		.max(100, "Nome deve ter no máximo 100 caracteres")
		.trim()
		.optional(),
});

export type PackageConfirmDeliveryDto = z.infer<
	typeof packageConfirmDeliverySchema
>;

export const transformConfirmDeliveryPackageDto = (
	data: PackageConfirmDeliveryDto,
): PackageConfirmDeliveryDto => {
	return packageConfirmDeliverySchema.parse(data);
};
