import { z } from "zod";
import { VehicleTypeEnum } from "@/v1/enum/vehicleType.enum";

export const visitorCreateSchema = z.object({
	name: z
		.string({ required_error: "Nome é obrigatório" })
		.min(3, "Nome deve ter no mínimo 3 caracteres")
		.max(100, "Nome deve ter no máximo 100 caracteres")
		.trim(),
	email: z
		.string()
		.email("Email deve ser válido")
		.optional()
		.transform((val) => (val === "" ? undefined : val)),
	document: z
		.string()
		.optional()
		.transform((val) => (val === "" ? undefined : val)),
	phone: z
		.string()
		.optional()
		.refine(
			(val) => !val || /^[\d\s\(\)\-]+$/.test(val),
			"Telefone deve conter apenas números, espaços, parênteses e hífens",
		)
		.transform((val) => (val === "" ? undefined : val)),
	vehicleType: z
		.enum([VehicleTypeEnum.CARRO, VehicleTypeEnum.MOTO])
		.optional()
		.transform((val) => (val === "" ? undefined : val)),
	vehiclePlate: z
		.string()
		.optional()
		.refine(
			(val) => !val || /^[A-Z]{3}\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/.test(val),
			"Placa deve estar no formato antigo (ABC1234) ou Mercosul (ABC1D23)",
		)
		.transform((val) => (val === "" ? undefined : val)),
	apartmentId: z
		.string()
		.uuid("ID do apartamento deve ser um UUID válido")
		.optional()
		.transform((val) => (val === "" ? undefined : val)),
	types: z
		.array(z.enum(["CONVIDADO", "PRESTADOR"]))
		.min(1, "Deve ter pelo menos um tipo de visitante")
		.refine(
			(types) => types.length > 0,
			"Deve ter pelo menos um tipo de visitante",
		),
	note: z
		.string()
		.optional()
		.transform((val) => (val === "" ? undefined : val)),
});

export type VisitorCreateDto = z.infer<typeof visitorCreateSchema>;

export const transformCreateVisitorDto = (
	data: any,
): VisitorCreateDto => {
	// Handle array types from form data
	if (typeof data.types === "string") {
		data.types = [data.types];
	} else if (Array.isArray(data.types)) {
		// Already an array
	} else {
		data.types = [];
	}

	// Ensure types are uppercase
	if (Array.isArray(data.types)) {
		data.types = data.types.map((type: string) => type.toUpperCase());
	}

	// Ensure vehicleType is uppercase if provided
	if (data.vehicleType && typeof data.vehicleType === "string") {
		data.vehicleType = data.vehicleType.toUpperCase();
	}

	return visitorCreateSchema.parse(data);
};

