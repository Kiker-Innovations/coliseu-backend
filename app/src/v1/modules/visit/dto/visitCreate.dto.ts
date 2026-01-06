import { z } from "zod";

export const visitCreateSchema = z.object({
	visitorId: z
		.string({ required_error: "ID do visitante é obrigatório" })
		.uuid("ID do visitante deve ser um UUID válido"),
	apartmentId: z
		.string()
		.uuid("ID do apartamento deve ser um UUID válido")
		.optional()
		.transform((val) => (val === "" ? undefined : val)),
	note: z
		.string()
		.max(500, "Observação deve ter no máximo 500 caracteres")
		.optional()
		.transform((val) => (val === "" || !val ? undefined : val.trim())),
});

export type VisitCreateDto = z.infer<typeof visitCreateSchema>;

export const transformCreateVisitDto = (data: any): VisitCreateDto => {
	return visitCreateSchema.parse(data);
};
