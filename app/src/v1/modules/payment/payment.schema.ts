import {
	protectedSchema,
	unauthorizedResponse,
	forbiddenResponse,
} from "../../utils/schemaHelper";

export class PaymentSchema {
	public update = {
		params: {
			type: "object",
			required: ["id"],
			properties: {
				id: {
					type: "string",
					description: "ID do pagamento",
					example: "123e4567-e89b-12d3-a456-426614174000",
				},
			},
		},
		body: {
			type: "object",
			properties: {
				status: {
					type: "string",
					enum: ["PENDENTE", "PAGO", "CANCELADO", "ERROR"],
					description: "Status do pagamento",
					example: "PAGO",
				},
				error: {
					type: "string",
					description: "Mensagem de erro (se houver)",
					example: "Erro ao processar pagamento",
					maxLength: 1000,
				},
				brCode: {
					type: "string",
					description: "Código PIX (BR Code)",
					example: "00020126360014BR.GOV.BCB.PIX0114+5513999999999...",
				},
				brCodeBase64: {
					type: "string",
					description: "Código PIX em Base64",
					example: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
				},
				paymentOriginId: {
					type: "string",
					description: "ID do pagamento no gateway",
					example: "pay_123456789",
				},
			},
		},
		response: {
			200: {
				description: "Pagamento atualizado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							paymentOriginId: { type: "string" },
							status: { type: "string" },
							error: { type: "string" },
							updatedAt: { type: "string" },
						},
					},
				},
			},
			404: {
				description: "Pagamento não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			400: {
				description: "Dados inválidos",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public getById = protectedSchema({
		params: {
			type: "object",
			required: ["id"],
			properties: {
				id: {
					type: "string",
					description: "ID do pagamento",
					example: "123e4567-e89b-12d3-a456-426614174000",
				},
			},
		},
		response: {
			200: {
				description: "Pagamento encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							paymentOriginId: { type: "string" },
							entityOriginId: { type: "string" },
							brCode: { type: "string" },
							brCodeBase64: { type: "string" },
							platformFee: { type: "number" },
							type: { type: "string" },
							gateway: { type: "string" },
							value: { type: "number" },
							residentId: { type: "string" },
							apartmentId: { type: "string" },
							buildingId: { type: "string" },
							status: { type: "string" },
							error: { type: "string" },
							createdAt: { type: "string" },
							updatedAt: { type: "string" },
							expiresAt: { type: "string" },
						},
					},
				},
			},
			404: {
				description: "Pagamento não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			...unauthorizedResponse,
			...forbiddenResponse,
		},
	});

	public getByPaymentOriginId = protectedSchema({
		params: {
			type: "object",
			required: ["paymentOriginId"],
			properties: {
				paymentOriginId: {
					type: "string",
					description: "ID do pagamento no gateway",
					example: "pay_123456789",
				},
			},
		},
		response: {
			200: {
				description: "Pagamento encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							paymentOriginId: { type: "string" },
							status: { type: "string" },
						},
					},
				},
			},
			404: {
				description: "Pagamento não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			...unauthorizedResponse,
			...forbiddenResponse,
		},
	});

	public updateByOriginId = {
		body: {
			type: "object",
			// Não exigir campos obrigatórios - o AbacatePay pode enviar em formatos diferentes
			// A validação será feita manualmente no controller
			additionalProperties: true, // Permitir campos adicionais do AbacatePay
		},
		response: {
			200: {
				description: "Pagamento atualizado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							paymentOriginId: { type: "string" },
							status: { type: "string" },
							error: { type: "string" },
							updatedAt: { type: "string" },
						},
					},
				},
			},
			404: {
				description: "Pagamento não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			400: {
				description: "Dados inválidos",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public getByEntityOriginId = protectedSchema({
		params: {
			type: "object",
			required: ["entityOriginId"],
			properties: {
				entityOriginId: {
					type: "string",
					description: "ID da entidade de origem (booking)",
					example: "123e4567-e89b-12d3-a456-426614174000",
				},
			},
		},
		response: {
			200: {
				description: "Pagamento encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							paymentOriginId: { type: "string" },
							entityOriginId: { type: "string" },
							brCode: { type: "string" },
							brCodeBase64: { type: "string" },
							platformFee: { type: "number" },
							method: { type: "string" },
							type: { type: "string" },
							gateway: { type: "string" },
							value: { type: "number" },
							residentId: { type: "string" },
							apartmentId: { type: "string" },
							buildingId: { type: "string" },
							status: { type: "string" },
							error: { type: "string" },
							createdAt: { type: "string" },
							updatedAt: { type: "string" },
							expiresAt: { type: "string" },
						},
					},
				},
			},
			404: {
				description: "Pagamento não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			...unauthorizedResponse,
			...forbiddenResponse,
		},
	});
}

