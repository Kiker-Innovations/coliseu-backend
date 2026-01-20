import { z } from "zod";
import { AmenityStatusEnumValues } from "@/v1/enum/amenityStatus.enum";

export const amenityUpdateSchema = z
	.object({
		buildingId: z
			.string()
			.uuid("ID do edifício deve ser um UUID válido")
			.optional(),
		name: z
			.string()
			.min(3, "Nome deve ter no mínimo 3 caracteres")
			.max(100, "Nome deve ter no máximo 100 caracteres")
			.trim()
			.optional(),
		description: z.preprocess(
			(val) => (val === "" || val === null ? undefined : val),
			z
				.string()
				.max(500, "Descrição deve ter no máximo 500 caracteres")
				.trim()
				.optional(),
		),
		type: z
			.enum(["COMODIDADE", "AREA_COMUM"], {
				errorMap: () => ({ message: "Tipo deve ser COMODIDADE ou AREA_COMUM" }),
			})
			.optional(),
		value: z.preprocess((val) => {
			if (val === "" || val === null || val === undefined) return undefined;
			const num = typeof val === "string" ? Number(val) : val;
			if (isNaN(num as number) || !isFinite(num as number)) return undefined;
			return num;
		}, z.number().min(0, "Valor não pode ser negativo").optional()),
		fineValue: z.preprocess((val) => {
			if (val === "" || val === null || val === undefined) return undefined;
			const num = typeof val === "string" ? Number(val) : val;
			if (isNaN(num as number) || !isFinite(num as number)) return undefined;
			return num;
		}, z
			.number()
			.min(0, "Valor da multa por atraso não pode ser negativo")
			.optional()),
		nonComplianceFine: z.preprocess((val) => {
			if (val === "" || val === null || val === undefined) return undefined;
			const num = typeof val === "string" ? Number(val) : val;
			if (isNaN(num as number) || !isFinite(num as number)) return undefined;
			return num;
		}, z
			.number()
			.min(0, "Valor da multa por descumprimento não pode ser negativo")
			.optional()),
		maxResidents: z.preprocess((val) => {
			if (val === "" || val === null || val === undefined) return undefined;
			const num = typeof val === "string" ? Number(val) : val;
			if (isNaN(num as number) || !isFinite(num as number)) return undefined;
			return num;
		}, z
			.number()
			.int("Quantidade Máxima de Residentes deve ser um valor inteiro")
			.min(1, "Quantidade Máxima de Residentes deve ser pelo menos 1")
			.optional()),
	maxHours: z.preprocess((val) => {
		if (val === "" || val === null || val === undefined) return undefined;
		const num = typeof val === "string" ? Number(val) : val;
		if (isNaN(num as number) || !isFinite(num as number)) return undefined;
		return num;
	}, z
		.number()
		.max(24, "Limite de horas não pode ser maior que 24")
		.optional()),
		bookingType: z
			.enum(["DIARIO", "POR_HORAS"], {
				errorMap: () => ({
					message: "Tipo de reserva deve ser DIARIO ou POR_HORAS",
				}),
			})
			.optional(),
		usageRules: z.preprocess(
			(val) => (val === "" || val === null ? undefined : val),
			z
				.string()
				.max(5000, "Normas de uso devem ter no máximo 5000 caracteres")
				.trim()
				.optional(),
		),
		openingTime: z.preprocess(
			(val) => (val === "" || val === null ? undefined : val),
			z
				.string()
				.regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Horário de abertura deve estar no formato HH:mm (ex: 08:00)")
				.optional(),
		),
		closingTime: z.preprocess(
			(val) => (val === "" || val === null ? undefined : val),
			z
				.string()
				.regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Horário de fechamento deve estar no formato HH:mm (ex: 22:00)")
				.optional(),
		),
		items: z
			.array(
				z.object({
					name: z
						.string({ required_error: "Nome do item é obrigatório" })
						.min(1, "Nome do item não pode ser vazio")
						.max(100, "Nome do item deve ter no máximo 100 caracteres"),
					quantity: z
						.number({ required_error: "Quantidade é obrigatória" })
						.int("Quantidade deve ser um número inteiro")
						.min(1, "Quantidade deve ser pelo menos 1"),
				})
			)
			.optional(),
		status: z
			.enum(AmenityStatusEnumValues as [string, ...string[]], {
				errorMap: () => ({ message: "Status deve ser ATIVO ou INATIVO" }),
			})
			.optional(),
	})
	.refine(
		(data) => {
			// Se openingTime ou closingTime for fornecido, ambos devem ser fornecidos
			if (
				(data.openingTime && !data.closingTime) ||
				(!data.openingTime && data.closingTime)
			) {
				return false;
			}
			return true;
		},
		{
			message: "Horário de abertura e fechamento devem ser fornecidos juntos",
			path: ["openingTime"],
		},
	)
	.refine(
		(data) => {
			// Se ambos forem fornecidos, closingTime deve ser maior que openingTime
			if (data.openingTime && data.closingTime) {
				const [openingHour, openingMinute] = data.openingTime.split(":").map(Number);
				const [closingHour, closingMinute] = data.closingTime.split(":").map(Number);
				const openingMinutes = openingHour * 60 + openingMinute;
				const closingMinutes = closingHour * 60 + closingMinute;
				
				if (closingMinutes <= openingMinutes) {
					return false;
				}
			}
			return true;
		},
		{
			message: "Horário de fechamento deve ser maior que horário de abertura",
			path: ["closingTime"],
		},
	)
	.refine(
		(data) => {
			// Se type é AREA_COMUM, value não deve ser fornecido
			if (
				data.type === "AREA_COMUM" &&
				data.value !== undefined &&
				data.value !== null
			) {
				return false;
			}
			return true;
		},
		{
			message: "Área comum não pode ter valor de uso",
			path: ["value"],
		},
	)
;

export type AmenityUpdateDto = z.infer<typeof amenityUpdateSchema>;

export const transformUpdateAmenityDto = (
	data: AmenityUpdateDto,
): AmenityUpdateDto => {
	// Remover campos undefined antes de validar
	const cleanedData: any = {};
	Object.keys(data).forEach((key) => {
		const value = (data as any)[key];
		if (value !== undefined && value !== null && value !== "") {
			cleanedData[key] = value;
		}
	});

	return amenityUpdateSchema.parse(cleanedData);
};
