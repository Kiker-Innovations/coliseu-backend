import { z } from "zod";

export const packageCancelSchema = z.object({
	cancelReason: z
		.string({ required_error: "Justificativa do cancelamento é obrigatória" })
		.min(10, "Justificativa deve ter no mínimo 10 caracteres")
		.max(500, "Justificativa deve ter no máximo 500 caracteres")
		.trim(),
});

export type PackageCancelDto = z.infer<typeof packageCancelSchema>;

export const transformCancelPackageDto = (
	data: PackageCancelDto,
): PackageCancelDto => {
	return packageCancelSchema.parse(data);
};
