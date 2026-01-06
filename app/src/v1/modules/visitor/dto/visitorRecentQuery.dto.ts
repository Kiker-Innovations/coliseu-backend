import { z } from "zod";

export const visitorRecentQuerySchema = z.object({
	limit: z
		.union([z.string(), z.number()])
		.optional()
		.transform((val) => {
			if (val === undefined || val === null) return 10;
			return typeof val === "string" ? parseInt(val, 10) : val;
		})
		.pipe(z.number().int().positive().max(100).default(10)),
});

export type VisitorRecentQueryDto = z.infer<typeof visitorRecentQuerySchema>;

export const transformVisitorRecentQueryDto = (
	query: any,
): VisitorRecentQueryDto => {
	return visitorRecentQuerySchema.parse(query);
};
