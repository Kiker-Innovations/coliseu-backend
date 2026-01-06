import { z } from "zod";

export const visitListQuerySchema = z.object({
	page: z
		.union([z.string(), z.number()])
		.optional()
		.transform((val) => {
			if (val === undefined || val === null) return 1;
			return typeof val === "string" ? parseInt(val, 10) : val;
		})
		.pipe(z.number().int().positive().default(1)),
	limit: z
		.union([z.string(), z.number()])
		.optional()
		.transform((val) => {
			if (val === undefined || val === null) return 10;
			return typeof val === "string" ? parseInt(val, 10) : val;
		})
		.pipe(z.number().int().positive().max(100).default(10)),
});

export type VisitListQueryDto = z.infer<typeof visitListQuerySchema>;

export const transformVisitListQueryDto = (data: any): VisitListQueryDto => {
	return visitListQuerySchema.parse(data);
};
