import { z } from "zod";

export const infractionCreateFineSchema = z.object({
	fineId: z
		.string({ required_error: "ID da multa é obrigatório" })
		.uuid("ID da multa deve ser um UUID válido"),
	apartmentId: z
		.string({ required_error: "ID do apartamento é obrigatório" })
		.uuid("ID do apartamento deve ser um UUID válido"),
	value: z
		.number({ required_error: "Valor é obrigatório" })
		.positive("Valor deve ser positivo")
		.min(0.01, "Valor deve ser maior que zero"),
	occurrenceDate: z.coerce.date({
		required_error: "Data da ocorrência é obrigatória",
	}),
});

export type InfractionCreateFineDto = z.infer<typeof infractionCreateFineSchema>;

export const transformCreateInfractionFineDto = (
	data: InfractionCreateFineDto
): InfractionCreateFineDto => {
	return infractionCreateFineSchema.parse(data);
};

