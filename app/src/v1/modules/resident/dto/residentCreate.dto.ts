import { z } from "zod";

export const residentCreateSchema = z.object({
	name: z
		.string({ required_error: "Nome é obrigatório" })
		.min(3, "Nome deve ter no mínimo 3 caracteres")
		.max(100, "Nome deve ter no máximo 100 caracteres")
		.regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras e espaços")
		.trim()
		.transform((val) => {
			// Converter para snake_case: remover espaços extras, converter para minúsculas e substituir espaços por underscore
			return val
				.trim()
				.replace(/\s+/g, " ") // Normalizar espaços múltiplos
				.toLowerCase()
				.replace(/\s/g, "_"); // Substituir espaços por underscore
		}),
	buildingId: z
		.string({ required_error: "ID do edifício é obrigatório" })
		.uuid("ID do edifício deve ser um UUID válido"),
	apartmentId: z
		.string({ required_error: "ID do apartamento é obrigatório" })
		.uuid("ID do apartamento deve ser um UUID válido"),
	email: z
		.string({ required_error: "Email é obrigatório" })
		.email("Email deve ser válido"),
	password: z
		.string({ required_error: "Senha é obrigatória" })
		.min(8, "Senha deve ter no mínimo 8 caracteres")
		.refine(
			(val) => /[A-Z]/.test(val),
			"Senha deve conter pelo menos uma letra maiúscula",
		)
		.refine(
			(val) => /[a-z]/.test(val),
			"Senha deve conter pelo menos uma letra minúscula",
		)
		.refine(
			(val) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val),
			"Senha deve conter pelo menos um caractere especial",
		),
	phone: z
		.string({ required_error: "Telefone é obrigatório" })
		.regex(
			/^\+\d{11,15}$/,
			"Telefone deve estar no formato internacional (ex: +5511999999999)",
		),
	document: z
		.string({ required_error: "CPF é obrigatório" })
		.regex(/^\d{11}$/, "CPF deve conter exatamente 11 dígitos")
		.refine(
			(cpf) => {
				// Remove caracteres não numéricos
				const cleanCpf = cpf.replace(/\D/g, "");
				
				// Verifica se tem 11 dígitos
				if (cleanCpf.length !== 11) return false;
				
				// Verifica se todos os dígitos são iguais
				if (/^(\d)\1{10}$/.test(cleanCpf)) return false;
				
				// Validação dos dígitos verificadores
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
		),
});

export type ResidentCreateDto = z.infer<typeof residentCreateSchema>;

export const transformCreateResidentDto = (
	data: ResidentCreateDto,
): ResidentCreateDto => {
	return residentCreateSchema.parse(data);
};
