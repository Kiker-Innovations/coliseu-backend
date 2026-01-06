import { z } from "zod";
import { PollStatusEnum } from "@/v1/enum/pollStatus.enum";

const basePollListSchema = z.object({
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

export const pollListByMonthYearSchema = basePollListSchema;

export const pollListByStatusSchema = basePollListSchema.extend({
	status: z
		.array(
			z.enum([
				PollStatusEnum.ATIVO,
				PollStatusEnum.PROGRAMADO,
				PollStatusEnum.FINALIZADO,
				PollStatusEnum.CANCELADO,
			]),
			{ required_error: "Status é obrigatório" },
		)
		.min(1, "Deve haver pelo menos um status")
		.max(4, "Máximo de 4 status permitidos"),
});

export type PollListByMonthYearDto = z.infer<typeof pollListByMonthYearSchema>;
export type PollListByStatusDto = z.infer<typeof pollListByStatusSchema>;

export const transformPollListByMonthYearDto = (
	data: PollListByMonthYearDto,
): PollListByMonthYearDto => {
	return pollListByMonthYearSchema.parse(data);
};

export const transformPollListByStatusDto = (
	data: PollListByStatusDto,
): PollListByStatusDto => {
	return pollListByStatusSchema.parse(data);
};
