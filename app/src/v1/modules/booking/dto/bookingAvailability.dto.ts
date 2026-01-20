export interface BookingAvailabilityQueryDto {
	amenityId: string;
	startDate: string; // ISO date string
	endDate: string; // ISO date string
}

export interface BookingAvailabilityDay {
	date: string; // ISO date string (YYYY-MM-DD)
	available: boolean;
}

export interface BookingAvailabilityResponse {
	amenityId: string;
	startDate: string;
	endDate: string;
	days: BookingAvailabilityDay[];
}

export interface BookingHoursAvailabilityQueryDto {
	amenityId: string;
	date: string; // ISO date string (YYYY-MM-DD)
}

export interface BookingHoursAvailabilityHour {
	hour: number; // 0-23
	available: boolean;
}

export interface BookingHoursAvailabilityResponse {
	amenityId: string;
	date: string;
	dayAvailable: boolean; // Se tem pelo menos uma hora disponível
	hours: BookingHoursAvailabilityHour[];
}

export function transformBookingAvailabilityQueryDto(
	query: any,
): BookingAvailabilityQueryDto {
	return {
		amenityId: query.amenityId as string,
		startDate: query.startDate as string,
		endDate: query.endDate as string,
	};
}

export function transformBookingHoursAvailabilityQueryDto(
	query: any,
): BookingHoursAvailabilityQueryDto {
	return {
		amenityId: query.amenityId as string,
		date: query.date as string,
	};
}

