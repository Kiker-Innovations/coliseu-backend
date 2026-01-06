import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export const getDate = (): Date => {
	return dayjs().tz("America/Sao_Paulo").toDate();
};

export const toDate = (date?: string | Date | number): dayjs.Dayjs => {
	return dayjs(date).tz("America/Sao_Paulo");
};

export const formatDate = (
	date?: string | Date | number,
	format = "YYYY-MM-DD HH:mm:ss",
): string => {
	return toDate(date).format(format);
};
