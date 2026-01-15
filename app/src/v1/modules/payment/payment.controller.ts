import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import { env } from "../../../config/env";
import { httpException } from "../../../config/error";
import { transformPaymentUpdateDto } from "./dto";
import { PaymentService } from "./payment.service";

export class PaymentController {
	private paymentService: PaymentService;

	constructor(mongoClient: MongoClient) {
		this.paymentService = new PaymentService(mongoClient);
	}

	public async updatePayment(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const { webhookSecret } = request.query as { webhookSecret?: string };
		const expectedSecret = env.providers.abacatepay.webhookSecret;

		if (expectedSecret && webhookSecret !== expectedSecret) {
			throw httpException(
				"Webhook secret inválido",
				httpStatus.UNAUTHORIZED,
			);
		}
		
		return reply
			.code(httpStatus.OK)
			.send(
				await this.paymentService.updatePayment(request.body),
			);
	}

	public async getPaymentByEntityOriginId(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const { entityOriginId } = request.params as { entityOriginId: string };
		return reply
			.code(httpStatus.OK)
			.send(
				await this.paymentService.getPaymentByEntityOriginId(entityOriginId),
			);
	}
}

