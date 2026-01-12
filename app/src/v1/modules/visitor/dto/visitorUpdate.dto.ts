import { z } from "zod";
import { VehicleTypeEnum } from "@/v1/enum/vehicleType.enum";

export const visitorUpdateSchema = z.object({
	name: z
		.string()
		.min(3, "Nome deve ter no mínimo 3 caracteres")
		.max(100, "Nome deve ter no máximo 100 caracteres")
		.trim()
		.optional(),
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
	vehicleType: z.enum([VehicleTypeEnum.CARRO, VehicleTypeEnum.MOTO]).optional(),
	vehiclePlate: z
		.string()
		.optional()
		.refine(
			(val) => !val || /^[A-Z]{3}\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/.test(val),
			"Placa deve estar no formato antigo (ABC1234) ou Mercosul (ABC1D23)",
		)
		.transform((val) => (val === "" ? undefined : val)),
	types: z
		.array(z.enum(["CONVIDADO", "PRESTADOR"]))
		.min(1, "Deve ter pelo menos um tipo de visitante")
		.optional(),
	companyName: z
		.string()
		.max(100, "Nome da empresa deve ter no máximo 100 caracteres")
		.optional()
		.transform((val) => (val === "" ? undefined : val)),
	note: z
		.string()
		.optional()
		.transform((val) => (val === "" ? undefined : val)),
	active: z.boolean().optional(),
});

export type VisitorUpdateDto = z.infer<typeof visitorUpdateSchema>;

export const transformUpdateVisitorDto = (data: any): VisitorUpdateDto => {
	// Handle array types from form data
	if (data.types) {
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
	}

	// Ensure vehicleType is uppercase if provided
	if (data.vehicleType && typeof data.vehicleType === "string") {
		data.vehicleType = data.vehicleType.toUpperCase();
	}

	return visitorUpdateSchema.parse(data);
};
