import { z } from "zod";

export const amenityBookingCreateSchema = z.object({
	amenityId: z
		.string({ required_error: "ID da comodidade é obrigatório" })
		.uuid("ID da comodidade deve ser um UUID válido"),
	startDate: z.coerce.date({ required_error: "Data de início é obrigatória" }),
	endDate: z.coerce.date({ required_error: "Data de término é obrigatória" }).optional(),
	startTime: z
		.string()
		.regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (use HH:mm)")
		.optional(),
	endTime: z
		.string()
		.regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (use HH:mm)")
		.optional(),
	numberOfHours: z
		.number()
		.int("Número de horas deve ser um inteiro")
		.min(1, "Número de horas deve ser pelo menos 1")
		.optional(),
	observation: z
		.string()
		.max(500, "Observação deve ter no máximo 500 caracteres")
		.optional(),
}).refine((data) => {
	// Para reserva DIARIO, endDate é obrigatório
	if (!data.startTime && !data.endTime) {
		if (!data.endDate) {
			return false;
		}
		return data.endDate > data.startDate;
	}
	return true;
}, {
	message: "Data de término deve ser posterior à data de início",
	path: ["endDate"],
}).refine((data) => {
	// Para reserva POR_HORAS, startTime e endTime são obrigatórios
	if (data.startTime || data.endTime) {
		if (!data.startTime || !data.endTime) {
			return false;
		}
		// Validar que endTime é depois de startTime
		const [startHour, startMin] = data.startTime.split(":").map(Number);
		const [endHour, endMin] = data.endTime.split(":").map(Number);
		const startMinutes = startHour * 60 + startMin;
		const endMinutes = endHour * 60 + endMin;
		return endMinutes > startMinutes;
	}
	return true;
}, {
	message: "Hora de término deve ser posterior à hora de início",
	path: ["endTime"],
});

export type AmenityBookingCreateDto = z.infer<typeof amenityBookingCreateSchema>;

export const transformCreateAmenityBookingDto = (
	data: AmenityBookingCreateDto,
): AmenityBookingCreateDto => {
	return amenityBookingCreateSchema.parse(data);
};

