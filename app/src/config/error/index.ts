import { getDate } from "@/v1/utils/utils";
import type { FastifyReply, FastifyRequest } from "fastify";
import HttpStatus from "http-status";
import type { ZodError } from "zod";

const isFastifyError = (error: any): boolean => {
	return error.code < 600 || (error.statusCode && error.statusCode === 400);
};

const isZodError = (error: any): boolean => {
	return !!error.issues;
};

const isFlowError = (error: any): boolean => {
	return error.message;
};

export const errorHandler = (
	genericError: any,
	_request: FastifyRequest,
	reply: FastifyReply,
) => {
	const error = { ...genericError };
	
	if (isFlowError(error)) {
		return reply.status(error.statusCode).send({
			statusCode: error?.statusCode || 500,
			message: error.message,
			timestamp: getDate(),
		});
	}

	if (isFastifyError(error)) {
		const validationContext = error.validationContext
			? `${error.validationContext} `
			: "";
		const validationErrors = error.validation
			? error.validation.map((err: any) => ({
					field: err.instancePath || err.params?.missingProperty || err.params?.additionalProperty,
					message: err.message,
				}))
			: [];
		
		return reply.status(400).send({
			statusCode: error.statusCode,
			message: `Invalid request ${validationContext}input`,
			...(validationErrors.length > 0 && { errors: validationErrors }),
			timestamp: getDate(),
		});
	}

	if (isZodError(error)) {
		const zodError = error as ZodError;
		const errors = zodError.issues.map((issue) => ({
			field: issue.path.join("."),
			message: issue.message,
		}));

		return reply.status(400).send({
			statusCode: 400,
			message: "Erro de validação nos dados fornecidos",
			errors,
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
