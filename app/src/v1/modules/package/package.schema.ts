export class PackageSchema {
	public create = {
		body: {
			type: "object",
			required: ["apartmentId", "receiverDate"],
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
				courierName: {
					type: "string",
					description: "Nome do entregador",
					example: "Pedro Santos",
				},
				receiverDate: {
					type: "string",
					format: "date-time",
					description: "Data e hora de chegada",
					example: "2025-01-15T10:30:00Z",
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
							courierName: { type: "string" },
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

	public getPackages = {
		query: {
			type: "object",
			properties: {
				status: {
					type: "string",
					enum: ["PENDENTE", "ENTREGUE", "CANCELADO"],
					description: "Filtro opcional por status da encomenda",
					example: "PENDENTE",
				},
				days: {
					type: "number",
					description:
						"Número de dias para buscar cancelados (apenas quando status=CANCELADO, padrão: 7)",
					example: 7,
					default: 7,
				},
			},
		},
		response: {
			200: {
				description: "Encomendas encontradas",
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
								courierName: { type: "string" },
								apartmentNumber: { type: "string" },
								apartmentFloor: {
									type: "number",
									description: "Andar do apartamento",
								},
								apartmentBlock: {
									type: "string",
									description: "Bloco do apartamento (opcional)",
								},
								receiverDate: { type: "string", format: "date-time" },
								receiverBy: { type: "string" },
								deliveryDate: { type: "string", format: "date-time" },
								recipientName: { type: "string" },
								deliveryBy: { type: "string" },
								cancelReason: { type: "string" },
								canceledBy: { type: "string" },
								cancelledAt: { type: "string", format: "date-time" },
							},
						},
					},
				},
			},
			403: {
				description: "Apenas porteiros podem visualizar encomendas",
				type: "object",
				properties: {
					statusCode: { type: "number" },
					message: { type: "string" },
					timestamp: { type: "string" },
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
							receiverBy: { type: "string" },
							deliveryBy: { type: "string" },
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
							apartmentFloor: {
								type: "number",
								description: "Andar do apartamento",
							},
							apartmentBlock: {
								type: "string",
								description: "Bloco do apartamento (opcional)",
							},
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
			properties: {
				recipientName: {
					type: "string",
					description: "Nome de quem recebeu a encomenda",
					example: "Maria Silva",
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
							receiverBy: { type: "string" },
							deliveryBy: { type: "string" },
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

	public getStats = {
		response: {
			200: {
				description: "Estatísticas de encomendas obtidas com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							totalPendings: {
								type: "number",
								description: "Quantidade total de encomendas pendentes",
							},
							totalConfirmed: {
								type: "number",
								description: "Quantidade total de encomendas entregues hoje",
							},
							totalPendingsWeek: {
								type: "number",
								description:
									"Quantidade total de encomendas entregues nesta semana",
							},
						},
					},
				},
			},
		},
	};

	public cancel = {
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
			required: ["cancelReason"],
			properties: {
				cancelReason: {
					type: "string",
					description: "Justificativa do cancelamento",
					example: "Encomenda retornada ao remetente",
				},
			},
		},
		response: {
			200: {
				description: "Encomenda cancelada com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							apartmentId: { type: "string" },
							receiverBy: { type: "string" },
							deliveryBy: { type: "string" },
							ownerName: { type: "string" },
							courierName: { type: "string" },
							recipientName: { type: "string" },
							description: { type: "string" },
							receiverDate: { type: "string", format: "date-time" },
							deliveryDate: { type: "string", format: "date-time" },
							status: { type: "string" },
							cancelReason: { type: "string" },
							canceledBy: { type: "string" },
							cancelledAt: { type: "string", format: "date-time" },
							createdAt: { type: "string", format: "date-time" },
							updatedAt: { type: "string", format: "date-time" },
						},
					},
				},
			},
			400: {
				description: "Dados inválidos ou encomenda já cancelada/entregue",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
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

	public getMyPackages = {
		query: {
			type: "object",
			properties: {
				status: {
					type: "string",
					enum: ["PENDENTE", "ENTREGUE", "CANCELADO"],
					description: "Filtro opcional por status da encomenda",
					example: "PENDENTE",
				},
			},
		},
		response: {
			200: {
				description: "Encomendas do morador encontradas",
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
								apartmentId: { type: "string" },
								buildingId: { type: "string" },
								receiverBy: { type: "string" },
								deliveryBy: { type: "string" },
								ownerName: { type: "string" },
								courierName: { type: "string" },
								recipientName: { type: "string" },
								description: { type: "string" },
								receiverDate: { type: "string", format: "date-time" },
								deliveryDate: { type: "string", format: "date-time" },
								status: { type: "string" },
								cancelReason: { type: "string" },
								canceledBy: { type: "string" },
								cancelledAt: { type: "string", format: "date-time" },
								createdAt: { type: "string", format: "date-time" },
								updatedAt: { type: "string", format: "date-time" },
								apartmentNumber: { type: "string" },
								apartmentFloor: {
									type: "number",
									description: "Andar do apartamento",
								},
								apartmentBlock: {
									type: "string",
									description: "Bloco do apartamento (opcional)",
								},
							},
						},
					},
				},
			},
			401: {
				description: "Não autenticado",
				type: "object",
				properties: {
					statusCode: { type: "number" },
					message: { type: "string" },
					timestamp: { type: "string" },
				},
			},
			403: {
				description: "Apenas moradores podem visualizar suas encomendas",
				type: "object",
				properties: {
					statusCode: { type: "number" },
					message: { type: "string" },
					timestamp: { type: "string" },
				},
			},
			400: {
				description: "Apartamento não encontrado no token",
				type: "object",
				properties: {
					statusCode: { type: "number" },
					message: { type: "string" },
					timestamp: { type: "string" },
				},
			},
		},
	};

	public getMyPackageStats = {
		response: {
			200: {
				description:
					"Estatísticas de encomendas do morador obtidas com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							totalAguardandoRetiradaMes: {
								type: "number",
								description:
									"Total de encomendas aguardando retirada no mês atual",
							},
							totalEntregues: {
								type: "number",
								description: "Total de encomendas entregues (todos os meses)",
							},
							totalAguardandoRetirada: {
								type: "number",
								description: "Total de encomendas aguardando retirada (todas)",
							},
						},
					},
				},
			},
			401: {
				description: "Não autenticado",
				type: "object",
				properties: {
					statusCode: { type: "number" },
					message: { type: "string" },
					timestamp: { type: "string" },
				},
			},
			403: {
				description: "Apenas moradores podem visualizar suas estatísticas",
				type: "object",
				properties: {
					statusCode: { type: "number" },
					message: { type: "string" },
					timestamp: { type: "string" },
				},
			},
			400: {
				description: "Apartamento não encontrado no token",
				type: "object",
				properties: {
					statusCode: { type: "number" },
					message: { type: "string" },
					timestamp: { type: "string" },
				},
			},
		},
	};
}
