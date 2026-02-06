import { z } from "zod";
import type { ConciergeShiftEnumType } from "@/v1/enum/conciergeShift.enum";
import type { ConciergeStatusEnumType } from "@/v1/enum/conciergeStatus.enum";

export const conciergeUpdateSchema = z.object({
	buildingId: z
		.string()
		.uuid("ID do edifício deve ser um UUID válido")
		.optional(),

	phone: z
		.string()
		.optional()
		.refine(
			(val) => val === undefined || val !== "",
			"Telefone não pode estar vazio",
		),

	name: z
		.string()
		.regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras e espaços")
		.trim()
		.transform((val) => {
			return val.trim().replace(/\s+/g, " ").toUpperCase();
		})
		.optional()
		.refine(
			(val) => val === undefined || val.trim() !== "",
			"Nome não pode estar vazio",
		),

	email: z
		.string()
		.email("Email inválido")
		.optional()
		.refine(
			(val) => val === undefined || val.trim() !== "",
			"Email não pode estar vazio",
		),

	shift: z.enum(["MANHA", "TARDE", "NOITE"]).optional(),

	status: z
		.enum(["INATIVO", "VALIDADO", "ATIVO", "DE_FERIAS"], {
			errorMap: () => ({
				message: "Status deve ser INATIVO, VALIDADO, ATIVO ou DE_FERIAS",
			}),
		})
		.optional() as unknown as z.ZodType<ConciergeStatusEnumType | undefined>,
});

export type ConciergeUpdateDto = z.infer<typeof conciergeUpdateSchema> & {
	shift?: ConciergeShiftEnumType;
	status?: ConciergeStatusEnumType;
};

export const transformUpdateConciergeDto = (
	data: ConciergeUpdateDto,
): ConciergeUpdateDto => {
	return conciergeUpdateSchema.parse(data);
};
