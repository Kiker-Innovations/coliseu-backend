import { z } from "zod";

export const residentConfirmSchema = z.object({
	email: z
		.string({ required_error: "Email é obrigatório" })
		.email("Email deve ser válido"),
	code: z
		.string({ required_error: "Código de confirmação é obrigatório" })
		.min(1, "Código de confirmação não pode ser vazio"),
});

export type ResidentConfirmDto = z.infer<typeof residentConfirmSchema>;

export interface IResidentConfirmDto {
	email: string;
	code: string;
}