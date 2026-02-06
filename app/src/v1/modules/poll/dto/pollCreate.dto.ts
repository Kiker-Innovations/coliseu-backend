import { z } from "zod";

export const pollCreateSchema = z
	.object({
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
		startDate: z.preprocess(
			(val) => {
				// If already a Date object, return it
				if (val instanceof Date) {
					return val;
				}
				// If string, try to parse it
				if (typeof val === "string") {
					// Try ISO format first (YYYY-MM-DDTHH:mm:ss.sssZ or similar)
					if (val.includes("T") || val.match(/^\d{4}-\d{2}-\d{2}/)) {
						const date = new Date(val);
						if (!isNaN(date.getTime())) {
							return date;
						}
					}
					// Try DD/MM/YYYY HH:mm format
					if (val.includes("/") && val.includes(" ")) {
						const [datePart, timePart] = val.split(" ");
						if (datePart && timePart) {
							const [day, month, year] = datePart.split("/").map(Number);
							const [hour, minute] = timePart.split(":").map(Number);
							if (
								day &&
								month &&
								year &&
								hour !== undefined &&
								minute !== undefined
							) {
								return new Date(year, month - 1, day, hour, minute, 0, 0);
							}
						}
					}
				}
				return val;
			},
			z.date({
				required_error: "Data de início é obrigatória",
				invalid_type_error: "Data de início deve ser uma data válida",
			}),
		),
		endDate: z.preprocess(
			(val) => {
				// If already a Date object, return it
				if (val instanceof Date) {
					return val;
				}
				// If string, try to parse it
				if (typeof val === "string") {
					// Try ISO format first (YYYY-MM-DDTHH:mm:ss.sssZ or similar)
					if (val.includes("T") || val.match(/^\d{4}-\d{2}-\d{2}/)) {
						const date = new Date(val);
						if (!isNaN(date.getTime())) {
							return date;
						}
					}
					// Try DD/MM/YYYY HH:mm format
					if (val.includes("/") && val.includes(" ")) {
						const [datePart, timePart] = val.split(" ");
						if (datePart && timePart) {
							const [day, month, year] = datePart.split("/").map(Number);
							const [hour, minute] = timePart.split(":").map(Number);
							if (
								day &&
								month &&
								year &&
								hour !== undefined &&
								minute !== undefined
							) {
								return new Date(year, month - 1, day, hour, minute, 0, 0);
							}
						}
					}
				}
				return val;
			},
			z.date({
				required_error: "Data de término é obrigatória",
				invalid_type_error: "Data de término deve ser uma data válida",
			}),
		),
	})
	.refine(
		(data) => {
			return data.endDate > data.startDate;
		},
		{
			message: "Data de término deve ser posterior à data de início",
			path: ["endDate"],
		},
	)
	.refine(
		(data) => {
			// Permite até 5 minutos no passado
			const now = new Date();
			const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
			return data.startDate >= fiveMinutesAgo;
		},
		{
			message: "Data de início não pode ser mais de 5 minutos no passado",
			path: ["startDate"],
		},
	);

export type PollCreateDto = z.infer<typeof pollCreateSchema>;

export const transformCreatePollDto = (data: PollCreateDto): PollCreateDto => {
	return pollCreateSchema.parse(data);
};
