import { z } from "zod";

export const bookingListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).optional().default(1),
	limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export type BookingListQueryDto = z.infer<typeof bookingListQuerySchema>;

export const transformBookingListQueryDto = (
	query: any,
): BookingListQueryDto => {
	// Apenas page e limit são aceitos
	const cleanedQuery: any = {};
	if (query.page !== undefined && query.page !== "" && query.page !== null) {
		cleanedQuery.page = query.page;
	}
	if (query.limit !== undefined && query.limit !== "" && query.limit !== null) {
		cleanedQuery.limit = query.limit;
	}
	return bookingListQuerySchema.parse(cleanedQuery);
};
