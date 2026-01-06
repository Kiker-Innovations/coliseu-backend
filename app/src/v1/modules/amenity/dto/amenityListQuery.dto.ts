import { z } from "zod";
import { AmenityStatusEnumValues } from "@/v1/enum/amenityStatus.enum";

export const amenityListQuerySchema = z.object({
	buildingId: z
		.string({ required_error: "ID do edifício é obrigatório" })
		.uuid("ID do edifício deve ser um UUID válido"),
	status: z
		.enum(AmenityStatusEnumValues as [string, ...string[]], {
			errorMap: () => ({ message: "Status deve ser ATIVO ou INATIVO" }),
		})
		.optional(),
	bookingType: z
		.enum(["DIARIO"], {
			errorMap: () => ({ message: "Tipo de reserva deve ser DIARIO" }),
		})
		.optional(),
});

export type AmenityListQueryDto = z.infer<typeof amenityListQuerySchema>;

export const transformAmenityListQueryDto = (
	data: AmenityListQueryDto,
): AmenityListQueryDto => {
	return amenityListQuerySchema.parse(data);
};
