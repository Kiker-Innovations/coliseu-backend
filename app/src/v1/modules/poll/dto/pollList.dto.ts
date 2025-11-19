import { z } from "zod";

export const pollListByMonthYearSchema = z.object({
	buildingId: z
		.string({ required_error: "ID do edifício é obrigatório" })
		.uuid("ID do edifício deve ser um UUID válido"),
	month: z
		.number({ required_error: "Mês é obrigatório" })
		.int("Mês deve ser um número inteiro")
		.min(1, "Mês deve ser entre 1 e 12")
		.max(12, "Mês deve ser entre 1 e 12"),
	year: z
		.number({ required_error: "Ano é obrigatório" })
		.int("Ano deve ser um número inteiro")
		.min(2000, "Ano deve ser maior ou igual a 2000")
		.max(2100, "Ano deve ser menor ou igual a 2100"),
});

export type PollListByMonthYearDto = z.infer<typeof pollListByMonthYearSchema>;

export const transformPollListByMonthYearDto = (
	data: PollListByMonthYearDto,
): PollListByMonthYearDto => {
	return pollListByMonthYearSchema.parse(data);
};

