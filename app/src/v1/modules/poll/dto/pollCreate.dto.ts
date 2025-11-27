import { z } from "zod";

export const pollCreateSchema = z.object({
	buildingId: z
		.string({ required_error: "ID do edifício é obrigatório" })
		.uuid("ID do edifício deve ser um UUID válido"),
	description: z
		.string({ required_error: "Descrição é obrigatória" })
		.min(3, "Descrição deve ter no mínimo 3 caracteres")
		.max(500, "Descrição deve ter no máximo 500 caracteres"),
	options: z
		.array(z.string().min(1, "Cada opção deve ter pelo menos 1 caractere"), {
			required_error: "Opções são obrigatórias",
		})
		.min(2, "Deve haver pelo menos 2 opções")
		.max(10, "Máximo de 10 opções permitidas"),
	startDate: z
		.string({ required_error: "Data de início é obrigatória" })
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Data de início deve estar no formato YYYY-MM-DD")
		.refine((str) => {
			const [year, month, day] = str.split("-").map(Number);
			const date = new Date(year, month - 1, day);
			return (
				date.getFullYear() === year &&
				date.getMonth() === month - 1 &&
				date.getDate() === day
			);
		}, "Data de início inválida")
		.transform((str) => {
			const [year, month, day] = str.split("-").map(Number);
			return new Date(year, month - 1, day, 0, 0, 0, 0);
		}),
	endDate: z
		.string({ required_error: "Data de término é obrigatória" })
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Data de término deve estar no formato YYYY-MM-DD")
		.refine((str) => {
			const [year, month, day] = str.split("-").map(Number);
			const date = new Date(year, month - 1, day);
			return (
				date.getFullYear() === year &&
				date.getMonth() === month - 1 &&
				date.getDate() === day
			);
		}, "Data de término inválida")
		.transform((str) => {
			const [year, month, day] = str.split("-").map(Number);
			return new Date(year, month - 1, day, 23, 59, 59, 999);
		}),
}).refine(
	(data) => {
		return data.endDate > data.startDate;
	},
	{
		message: "Data de término deve ser posterior à data de início",
		path: ["endDate"],
	},
);

export type PollCreateDto = z.infer<typeof pollCreateSchema>;

export const transformCreatePollDto = (
	data: PollCreateDto,
): PollCreateDto => {
	return pollCreateSchema.parse(data);
};

