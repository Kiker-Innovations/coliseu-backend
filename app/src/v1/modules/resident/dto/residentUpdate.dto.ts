import { z } from "zod";

export const residentUpdateSchema = z.object({
	name: z
		.string()
		.min(3, "Nome deve ter no mínimo 3 caracteres")
		.max(100, "Nome deve ter no máximo 100 caracteres")
		.regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras e espaços")
		.trim()
		.transform((val) => {
			return val.trim().replace(/\s+/g, " ").toUpperCase();
		})
		.optional(),
	buildingId: z
		.string()
		.uuid("ID do edifício deve ser um UUID válido")
		.optional(),
	apartmentId: z
		.string()
		.uuid("ID do apartamento deve ser um UUID válido")
		.optional(),
	email: z.string().email("Email inválido").optional(),
	password: z
		.string()
		.min(6, "Senha deve ter no mínimo 6 caracteres")
		.optional(),
	phone: z
		.string()
		.regex(
			/^\+\d{11,15}$/,
			"Telefone deve estar no formato internacional (ex: +5513974080222)",
		)
		.optional(),
	document: z
		.string()
		.regex(/^\d{11}$/, "CPF deve conter exatamente 11 dígitos")
		.refine(
			(cpf) => {
				if (!cpf) return true; // Opcional no update
				const cleanCpf = cpf.replace(/\D/g, "");
				if (cleanCpf.length !== 11) return false;
				if (/^(\d)\1{10}$/.test(cleanCpf)) return false;

				let sum = 0;
				for (let i = 0; i < 9; i++) {
					sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
				}
				let digit = 11 - (sum % 11);
				if (digit >= 10) digit = 0;
				if (digit !== parseInt(cleanCpf.charAt(9))) return false;

				sum = 0;
				for (let i = 0; i < 10; i++) {
					sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
				}
				digit = 11 - (sum % 11);
				if (digit >= 10) digit = 0;
				if (digit !== parseInt(cleanCpf.charAt(10))) return false;

				return true;
			},
			{ message: "CPF inválido" },
		)
		.optional(),
	photoUrl: z.string().url("URL da foto inválida").nullable().optional(),
});

export type ResidentUpdateDto = z.infer<typeof residentUpdateSchema>;

export const transformUpdateResidentDto = (
	data: ResidentUpdateDto,
): ResidentUpdateDto => {
	return residentUpdateSchema.parse(data);
};
