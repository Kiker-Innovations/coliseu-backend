import { z } from "zod";

export const infractionCreateNotificationSchema = z.object({
	fineId: z
		.string({ required_error: "ID da multa/notificação é obrigatório" })
		.uuid("ID da multa/notificação deve ser um UUID válido"),
	apartmentId: z
		.string({ required_error: "ID do apartamento é obrigatório" })
		.uuid("ID do apartamento deve ser um UUID válido"),
	description: z
		.string({ required_error: "Descrição é obrigatória" })
		.min(10, "Descrição deve ter no mínimo 10 caracteres")
		.max(1000, "Descrição deve ter no máximo 1000 caracteres")
		.trim(),
	occurrenceDate: z.coerce.date({
		required_error: "Data da ocorrência é obrigatória",
	}),
});

export type InfractionCreateNotificationDto = z.infer<
	typeof infractionCreateNotificationSchema
>;

export const transformCreateInfractionNotificationDto = (
	data: InfractionCreateNotificationDto,
): InfractionCreateNotificationDto => {
	return infractionCreateNotificationSchema.parse(data);
};
