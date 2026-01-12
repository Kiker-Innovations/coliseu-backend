import { getDate } from "@/v1/utils/utils";
import type { FastifyReply, FastifyRequest } from "fastify";
import HttpStatus from "http-status";
import { ZodError } from "zod";

const isFastifyError = (error: any): boolean => {
	return error.code < 600 || (error.statusCode && error.statusCode === 400);
};

const isZodError = (error: any): boolean => {
	return error instanceof ZodError || !!error.issues;
};

const isFlowError = (error: any): boolean => {
	return error.message && error.statusCode;
};

export const errorHandler = (
	genericError: any,
	_request: FastifyRequest,
	reply: FastifyReply,
) => {
	// Verificar ZodError PRIMEIRO usando o objeto original (não o spread)
	// porque o spread não copia corretamente a propriedade 'issues'
	if (isZodError(genericError)) {
		const zodError = genericError as ZodError;

		const errors = zodError.issues.map((issue) => ({
			field: issue.path.join("."),
			message: issue.message,
		}));

		return reply.status(400).send({
			statusCode: 400,
			message: errors[0]?.message || "Erro de validação nos dados fornecidos",
			errors,
			timestamp: getDate(),
		});
	}

	const error = { ...genericError };

	if (isFastifyError(error)) {
		const validationContext = error.validationContext
			? `${error.validationContext} `
			: "";
		const validationErrors = error.validation
			? error.validation.map((err: any) => ({
					field:
						err.instancePath ||
						err.params?.missingProperty ||
						err.params?.additionalProperty,
					message: err.message,
				}))
			: [];

		// Melhorar mensagem quando há erros específicos
		let errorMessage = `Invalid request ${validationContext}input`;
		if (validationErrors.length > 0) {
			// Verificar se é erro relacionado ao código de retirada
			const pickupCodeError = validationErrors.find(
				(err: any) =>
					err.field?.includes("pickupCode") ||
					err.message?.toLowerCase().includes("pickupcode") ||
					err.message?.toLowerCase().includes("código"),
			);
			if (pickupCodeError) {
				errorMessage = pickupCodeError.message || "Código de retirada fornecido inválido";
			} else {
				// Usar a primeira mensagem de erro específica se disponível
				const firstError = validationErrors[0];
				if (firstError?.message) {
					errorMessage = firstError.message;
				}
			}
		}

		return reply.status(400).send({
			statusCode: error.statusCode,
			message: errorMessage,
			...(validationErrors.length > 0 && { errors: validationErrors }),
			timestamp: getDate(),
		});
	}

	if (isFlowError(error)) {
		return reply.status(error.statusCode).send({
			statusCode: error?.statusCode || 500,
			message: error.message,
			timestamp: getDate(),
		});
	}

	process.stdout.write(
		`\n\n\x1b[41m--- UNEXPECTED ERROR --- \x1b[0m\n ${
			Object.keys(error).length ? JSON.stringify(error) : genericError
		}\n\x1b[41m--- END UNEXPECTED ERROR --- \x1b[0m\n\n\n`,
	);
	return reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
		statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
		message: HttpStatus[500],
		timestamp: getDate(),
	});
};

export const httpException = (
	message: string | string[],
	statusCode: number,
) => {
	return { message, statusCode };
};
