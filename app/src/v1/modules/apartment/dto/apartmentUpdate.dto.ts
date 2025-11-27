import { ApartmentStatusEnumType, ApartmentStatusEnumValues } from "@/v1/enum/apartmentStatus.enum";
import { z } from "zod";

export const apartmentUpdateSchema = z.object({
	buildingId: z
		.string()
		.uuid("ID do edifício deve ser um UUID válido")
		.optional(),
	number: z
		.string()
		.min(1, "Número do apartamento não pode ser vazio")
		.max(10, "Número do apartamento deve ter no máximo 10 caracteres")
		.trim()
		.optional(),
	block: z
		.string()
		.min(1, "Bloco não pode ser vazio")
		.max(50, "Bloco deve ter no máximo 50 caracteres")
		.trim()
		.optional(),
	floor: z
		.number()
		.int("Andar deve ser um valor inteiro")
		.min(0, "Andar deve ser maior ou igual a 0")
		.optional(),
	status: z.enum(ApartmentStatusEnumValues as [string, ...string[]]).optional() as unknown as z.ZodType<ApartmentStatusEnumType | undefined>,
});

export type ApartmentUpdateDto = z.infer<typeof apartmentUpdateSchema>;

export const transformUpdateApartmentDto = (
	data: ApartmentUpdateDto,
): ApartmentUpdateDto => {
	return apartmentUpdateSchema.parse(data);
};

