import { z } from "zod";

export const amenityBookingCreateSchema = z.object({
	amenityId: z
		.string({ required_error: "ID da comodidade é obrigatório" })
		.uuid("ID da comodidade deve ser um UUID válido"),
	startDate: z.coerce.date({ required_error: "Data de início é obrigatória" }),
	endDate: z.coerce.date({ required_error: "Data de término é obrigatória" }),
	totalValue: z
		.number({ required_error: "Valor total é obrigatório" })
		.positive("Valor total deve ser positivo"),
}).refine((data) => {
	// Validar que endDate é depois de startDate
	return data.endDate > data.startDate;
}, {
	message: "Data de término deve ser posterior à data de início",
	path: ["endDate"],
});

export type AmenityBookingCreateDto = z.infer<typeof amenityBookingCreateSchema>;

export const transformCreateAmenityBookingDto = (
	data: AmenityBookingCreateDto,
): AmenityBookingCreateDto => {
	return amenityBookingCreateSchema.parse(data);
};

