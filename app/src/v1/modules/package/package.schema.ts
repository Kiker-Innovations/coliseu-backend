export class PackageSchema {
	public create = {
		body: {
			type: "object",
			required: [
				"ownerName",
				"apartmentId",
				"description",
				"receiverDate",
				"receiverConciergeId",
			],
			properties: {
				ownerName: {
					type: "string",
					description: "Nome do destinatário",
					example: "João Silva",
				},
				apartmentId: {
					type: "string",
					format: "uuid",
					description: "ID do apartamento",
					example: "4bb39bb7-1baf-4593-be81-76a38ba3b807",
				},
				description: {
					type: "string",
					description: "Descrição da encomenda",
					example: "Pacote de roupas",
				},
				receiverDate: {
					type: "string",
					format: "date-time",
					description: "Data e hora de chegada",
					example: "2025-01-15T10:30:00Z",
				},
				receiverConciergeId: {
					type: "string",
					format: "uuid",
					description: "ID do porteiro que registrou",
					example: "4bb39bb7-1baf-4593-be81-76a38ba3b807",
				},
			},
		},
		response: {
			201: {
				description: "Encomenda criada com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							id: { type: "string" },
							ownerName: { type: "string" },
							description: { type: "string" },
						},
					},
				},
			},
			400: {
				description: "Dados inválidos",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					errors: {
						type: "array",
						items: {
							type: "object",
							properties: {
								field: { type: "string" },
								message: { type: "string" },
							},
						},
					},
				},
			},
			404: {
				description: "Apartamento ou porteiro não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public getPending = {
		response: {
			200: {
				description: "Encomendas pendentes encontradas",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "array",
						items: {
							type: "object",
							properties: {
								_id: { type: "string" },
								ownerName: { type: "string" },
								description: { type: "string" },
								apartmentNumber: { type: "string" },
								receiverDate: { type: "string", format: "date-time" },
								receiverConciergeName: { type: "string" },
							},
						},
					},
				},
			},
		},
	};

	public getDelivered = {
		response: {
			200: {
				description: "Encomendas entregues encontradas",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "array",
						items: {
							type: "object",
							properties: {
								_id: { type: "string" },
								ownerName: { type: "string" },
								description: { type: "string" },
								apartmentNumber: { type: "string" },
								deliveryDate: { type: "string", format: "date-time" },
								recipientName: { type: "string" },
								deliveryConciergeName: { type: "string" },
							},
						},
					},
				},
			},
		},
	};

	public getById = {
		params: {
			type: "object",
			required: ["id"],
			properties: {
				id: {
					type: "string",
					format: "uuid",
					description: "ID da encomenda",
				},
			},
		},
		response: {
			200: {
				description: "Encomenda encontrada",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							apartmentId: { type: "string" },
							receiverConciergeId: { type: "string" },
							deliveryConciergeId: { type: "string" },
							ownerName: { type: "string" },
							courierName: { type: "string" },
							recipientName: { type: "string" },
							description: { type: "string" },
							receiverDate: { type: "string", format: "date-time" },
							deliveryDate: { type: "string", format: "date-time" },
							status: { type: "string" },
							createdAt: { type: "string", format: "date-time" },
							updatedAt: { type: "string", format: "date-time" },
							apartmentNumber: { type: "string" },
							receiverConciergeName: { type: "string" },
							deliveryConciergeName: { type: "string" },
						},
					},
				},
			},
			404: {
				description: "Encomenda não encontrada",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public confirmDelivery = {
		params: {
			type: "object",
			required: ["id"],
			properties: {
				id: {
					type: "string",
					format: "uuid",
					description: "ID da encomenda",
				},
			},
		},
		body: {
			type: "object",
			required: ["recipientName", "deliveryConciergeId"],
			properties: {
				recipientName: {
					type: "string",
					description: "Nome de quem recebeu a encomenda",
					example: "Maria Silva",
				},
				deliveryConciergeId: {
					type: "string",
					format: "uuid",
					description: "ID do porteiro que registrou a entrega",
					example: "4bb39bb7-1baf-4593-be81-76a38ba3b807",
				},
			},
		},
		response: {
			200: {
				description: "Entrega confirmada com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							apartmentId: { type: "string" },
							receiverConciergeId: { type: "string" },
							deliveryConciergeId: { type: "string" },
							ownerName: { type: "string" },
							courierName: { type: "string" },
							recipientName: { type: "string" },
							description: { type: "string" },
							receiverDate: { type: "string", format: "date-time" },
							deliveryDate: { type: "string", format: "date-time" },
							status: { type: "string" },
							createdAt: { type: "string", format: "date-time" },
							updatedAt: { type: "string", format: "date-time" },
						},
					},
				},
			},
			400: {
				description: "Dados inválidos ou encomenda já entregue",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			404: {
				description: "Encomenda ou porteiro não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};
}

