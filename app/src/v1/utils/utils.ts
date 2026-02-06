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

/**
 * Calcula o status de uma enquete baseado nas datas
 * @param startDate Data de início da enquete
 * @param endDate Data de fim da enquete
 * @param cancelledAt Data de cancelamento (opcional)
 * @returns Status calculado: "CANCELADO" | "ATIVO" | "PROGRAMADO" | "FINALIZADO"
 */
export const calculatePollStatus = (
	startDate: Date,
	endDate: Date,
	cancelledAt?: Date | null,
): "CANCELADO" | "ATIVO" | "PROGRAMADO" | "FINALIZADO" => {
	const now = getDate();

	// Se tiver cancelledAt preenchido, retorna CANCELADO
	if (cancelledAt) {
		return "CANCELADO";
	}

	// Se startDate for posterior à data atual, retorna PROGRAMADO
	if (startDate.getTime() > now.getTime()) {
		return "PROGRAMADO";
	}

	// Se endDate for anterior à data atual, retorna FINALIZADO
	if (endDate.getTime() < now.getTime()) {
		return "FINALIZADO";
	}

	// Se estiver entre startDate e endDate, retorna ATIVO
	return "ATIVO";
};
