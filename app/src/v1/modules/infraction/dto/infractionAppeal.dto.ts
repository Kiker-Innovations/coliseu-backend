import { z } from "zod";

export const infractionAppealSchema = z.object({
	infractionId: z
		.string({ required_error: "ID da infração é obrigatório" })
		.uuid("ID da infração deve ser um UUID válido"),
	text: z
		.string({ required_error: "Texto da contestação é obrigatório" })
		.min(1, "Texto da contestação não pode estar vazio"),
	fileName: z
		.string({ required_error: "Nome do arquivo é obrigatório" })
		.min(1, "Nome do arquivo não pode estar vazio"),
	fileSize: z
		.number({ required_error: "Tamanho do arquivo é obrigatório" })
		.positive("Tamanho do arquivo deve ser positivo"),
	mimeType: z
		.string({ required_error: "Tipo MIME do arquivo é obrigatório" })
		.min(1, "Tipo MIME do arquivo não pode estar vazio"),
});

export type InfractionAppealDto = z.infer<typeof infractionAppealSchema>;

export const transformInfractionAppealDto = (
	data: InfractionAppealDto,
): InfractionAppealDto => {
	return infractionAppealSchema.parse(data);
};
