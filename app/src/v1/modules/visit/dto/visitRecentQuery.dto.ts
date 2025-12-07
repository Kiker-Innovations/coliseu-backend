import { z } from "zod";

export const visitRecentQuerySchema = z.object({
	limit: z
		.union([z.string(), z.number()])
		.optional()
		.transform((val) => {
			if (val === undefined || val === null) return 10;
			return typeof val === "string" ? parseInt(val, 10) : val;
		})
		.pipe(z.number().int().positive().max(100).default(10)),
});

export type VisitRecentQueryDto = z.infer<typeof visitRecentQuerySchema>;

export const transformVisitRecentQueryDto = (
	data: any,
): VisitRecentQueryDto => {
	return visitRecentQuerySchema.parse(data);
};

