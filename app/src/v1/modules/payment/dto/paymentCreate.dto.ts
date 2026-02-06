import { z } from "zod";
import type { PaymentType } from "../../../../database/mongodb/entity/payment.entity";

export const paymentCreateSchema = z.object({
	paymentOriginId: z
		.string({ required_error: "paymentOriginId é obrigatório" })
		.min(1, "paymentOriginId não pode estar vazio"),
	entityOriginId: z
		.string({ required_error: "entityOriginId é obrigatório" })
		.min(1, "entityOriginId não pode estar vazio"),
	brCode: z
		.string({ required_error: "brCode é obrigatório" })
		.min(1, "brCode não pode estar vazio"),
	brCodeBase64: z
		.string({ required_error: "brCodeBase64 é obrigatório" })
		.min(1, "brCodeBase64 não pode estar vazio"),
	platformFee: z
		.number({ required_error: "platformFee é obrigatório" })
		.positive("platformFee deve ser um número positivo"),
	type: z.enum(["BOOKING", "FINE"], {
		required_error: "type é obrigatório",
		invalid_type_error: "type deve ser BOOKING ou FINE",
	}),
	value: z
		.number({ required_error: "value é obrigatório" })
		.positive("value deve ser um número positivo"),
	residentId: z
		.string({ required_error: "residentId é obrigatório" })
		.min(1, "residentId não pode estar vazio"),
	apartmentId: z
		.string({ required_error: "apartmentId é obrigatório" })
		.min(1, "apartmentId não pode estar vazio"),
	buildingId: z
		.string({ required_error: "buildingId é obrigatório" })
		.min(1, "buildingId não pode estar vazio"),
	expiresAt: z.coerce.date({
		required_error: "expiresAt é obrigatório",
		invalid_type_error: "expiresAt deve ser uma data válida",
	}),
});

export type PaymentCreateDto = z.infer<typeof paymentCreateSchema>;

export const transformPaymentCreateDto = (data: unknown): PaymentCreateDto => {
	return paymentCreateSchema.parse(data);
};
