import { z } from "zod";
import type { PaymentStatus } from "../../../../database/mongodb/entity/payment.entity";

export const paymentUpdateSchema = z.object({
	status: z
		.enum(["PENDENTE", "PAGO", "CANCELADO", "ERROR"], {
			invalid_type_error: "status deve ser PENDENTE, PAGO, CANCELADO ou ERROR",
		})
		.optional(),
	error: z
		.string()
		.max(1000, "error deve ter no máximo 1000 caracteres")
		.optional(),
	brCode: z.string().min(1, "brCode não pode estar vazio").optional(),
	brCodeBase64: z
		.string()
		.min(1, "brCodeBase64 não pode estar vazio")
		.optional(),
	paymentOriginId: z
		.string()
		.min(1, "paymentOriginId não pode estar vazio")
		.optional(),
});

export type PaymentUpdateDto = z.infer<typeof paymentUpdateSchema>;

export const transformPaymentUpdateDto = (data: unknown): PaymentUpdateDto => {
	return paymentUpdateSchema.parse(data);
};

