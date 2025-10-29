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

	if (isFastifyError(error)) {
		const validationContext = error.validationContext
			? `${error.validationContext} `
			: "";
		return reply.status(400).send({
			statusCode: error.statusCode,
			message: `Invalid request ${validationContext}input`,
			timestamp: new Date(),
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
			timestamp: new Date(),
		});
	}

	if (isFlowError(error)) {
		return reply.status(error.statusCode).send({
			statusCode: error?.statusCode || 500,
			message: error.message,
			timestamp: new Date(),
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
		timestamp: new Date(),
	});
};

export const httpException = (
	message: string | string[],
	statusCode: number,
) => {
	return { message, statusCode };
};
