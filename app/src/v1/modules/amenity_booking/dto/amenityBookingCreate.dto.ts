import { z } from "zod";

export const amenityBookingCreateSchema = z
	.object({
		amenityId: z
			.string({ required_error: "ID da comodidade é obrigatório" })
			.uuid("ID da comodidade deve ser um UUID válido"),
		startDate: z.coerce.date({
			required_error: "Data de início é obrigatória",
		}),
		endDate: z.coerce.date({ required_error: "Data de término é obrigatória" }),
		observation: z
			.string()
			.max(500, "Observação deve ter no máximo 500 caracteres")
			.optional(),
	})
	.refine(
		(data) => {
			// Para reserva DIARIO, endDate é obrigatório
			if (!data.endDate) {
				return false;
			}
			return data.endDate > data.startDate;
		},
		{
			message: "Data de término deve ser posterior à data de início",
			path: ["endDate"],
		},
	);

export type AmenityBookingCreateDto = z.infer<
	typeof amenityBookingCreateSchema
>;

export const transformCreateAmenityBookingDto = (
	data: AmenityBookingCreateDto,
): AmenityBookingCreateDto => {
	return amenityBookingCreateSchema.parse(data);
};
