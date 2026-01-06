import { z } from "zod";

export const visitorListQuerySchema = z.object({
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
	search: z.string().optional(),
	filterBy: z.enum(["name", "document", "apartment"]).optional(),
});

export type VisitorListQueryDto = z.infer<typeof visitorListQuerySchema>;

export const transformVisitorListQueryDto = (
	query: any,
): VisitorListQueryDto => {
	return visitorListQuerySchema.parse(query);
};
