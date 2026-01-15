import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { PaymentController } from "./payment.controller";
import { PaymentSchema } from "./payment.schema";
import { AuthMiddleware } from "../auth/auth.middleware";

export class PaymentRouteV1 {
	private paymentController: PaymentController;
	private paymentSchema: PaymentSchema;
	private authMiddleware: AuthMiddleware;

	constructor(mongoClient: MongoClient) {
		this.paymentController = new PaymentController(mongoClient);
		this.paymentSchema = new PaymentSchema();
		this.authMiddleware = new AuthMiddleware(mongoClient);
	}

	/**
	 * Rota de webhook para atualizar pagamento (sem autenticação)
	 * Esta rota será acessada pela API de pagamento via webhook
	 */
	private updatePaymentWebhook = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/payments/webhook/abacatepay",
			schema: {
				tags: ["Payments"],
				summary: "Update payment status via webhook",
				description:
					"Atualiza o status de um pagamento via webhook. Esta rota não requer autenticação e será chamada pela API de pagamento.",
				body: {
					type: "object",
					additionalProperties: true,
				},
				response: {
					200: {
						description: "Pagamento atualizado com sucesso",
						type: "object",
					},
					400: {
						description: "Dados inválidos",
						type: "object",
					},
					401: {
						description: "Webhook secret inválido",
						type: "object",
					},
				},
			},
			handler: this.paymentController.updatePayment.bind(
				this.paymentController,
			) as RouteHandlerMethod,
		};
	};

	/**
	 * Rota protegida para buscar pagamento por entityOriginId
	 */
	private getByEntityOriginId = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/payments/entity/:entityOriginId",
			schema: {
				tags: ["Payments"],
				summary: "Get payment by entityOriginId",
				description:
					"Busca um pagamento pelo ID da entidade de origem (booking)",
				...this.paymentSchema.getByEntityOriginId,
			},
			preHandler: [this.authMiddleware.authenticate],
			handler: this.paymentController.getPaymentByEntityOriginId.bind(
				this.paymentController,
			) as RouteHandlerMethod,
		};
	};

	public routes = (): RouteOptions[] => {
		return [
			this.updatePaymentWebhook(),
			this.getByEntityOriginId(),
		];
	};
}

