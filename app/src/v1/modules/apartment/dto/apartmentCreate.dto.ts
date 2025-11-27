import { ApartmentStatusEnumType, ApartmentStatusEnumValues } from "@/v1/enum/apartmentStatus.enum";
import { z } from "zod";

export const apartmentCreateSchema = z.object({
	buildingId: z
		.string({ required_error: "ID do edifício é obrigatório" })
		.uuid("ID do edifício deve ser um UUID válido"),
	number: z
		.string({ required_error: "Número do apartamento é obrigatório" })
		.min(1, "Número do apartamento não pode ser vazio")
		.max(10, "Número do apartamento deve ter no máximo 10 caracteres")
		.trim(),
	block: z
		.string({ required_error: "Bloco é obrigatório" })
		.min(1, "Bloco não pode ser vazio")
		.max(50, "Bloco deve ter no máximo 50 caracteres")
		.trim(),
	floor: z
		.number({ required_error: "Andar é obrigatório" })
		.int("Andar deve ser um valor inteiro")
		.min(0, "Andar deve ser maior ou igual a 0"),
	status: z.enum(ApartmentStatusEnumValues as [string, ...string[]]).optional() as unknown as z.ZodType<ApartmentStatusEnumType | undefined>,
});

export type ApartmentCreateDto = z.infer<typeof apartmentCreateSchema>;

export const transformCreateApartmentDto = (
	data: ApartmentCreateDto,
): ApartmentCreateDto => {
	return apartmentCreateSchema.parse(data);
};

