import { z } from "zod";

export const amenityBookingListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).optional().default(1),
	limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export type AmenityBookingListQueryDto = z.infer<typeof amenityBookingListQuerySchema>;

export const transformAmenityBookingListQueryDto = (
	query: any,
): AmenityBookingListQueryDto => {
	// Apenas page e limit são aceitos
	const cleanedQuery: any = {};
	if (query.page !== undefined && query.page !== "" && query.page !== null) {
		cleanedQuery.page = query.page;
	}
	if (query.limit !== undefined && query.limit !== "" && query.limit !== null) {
		cleanedQuery.limit = query.limit;
	}
	return amenityBookingListQuerySchema.parse(cleanedQuery);
};

