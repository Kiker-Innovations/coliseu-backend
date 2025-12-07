export class VisitSchema {
	public create = {
		body: {
			type: "object",
			required: ["visitorId"],
			properties: {
				visitorId: {
					type: "string",
					format: "uuid",
					description: "ID do visitante",
					example: "123e4567-e89b-12d3-a456-426614174000",
				},
				apartmentId: {
					type: "string",
					format: "uuid",
					description: "ID do apartamento (opcional - pode ser para piscina, salão de jogos, etc.)",
					example: "123e4567-e89b-12d3-a456-426614174000",
				},
				note: {
					type: "string",
					description: "Observação sobre a visita (opcional)",
					example: "Visita para piscina",
					maxLength: 500,
				},
			},
		},
		response: {
			201: {
				description: "Visita registrada com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							visitorId: { type: "string" },
							apartmentId: { type: "string" },
							note: { type: "string" },
							registeredBy: { type: "string" },
							registeredAt: { type: "string", format: "date-time" },
							buildingId: { type: "string" },
							createdAt: { type: "string", format: "date-time" },
							updatedAt: { type: "string", format: "date-time" },
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
			403: {
				description: "Você não tem permissão para acessar este recurso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			401: {
				description: "Token de autenticação inválido ou não fornecido",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public listByVisitorId = {
		params: {
			type: "object",
			required: ["visitorId"],
			properties: {
				visitorId: {
					type: "string",
					format: "uuid",
					description: "ID do visitante",
					example: "123e4567-e89b-12d3-a456-426614174000",
				},
			},
		},
		querystring: {
			type: "object",
			properties: {
				page: {
					type: "number",
					description: "Número da página",
					example: 1,
					default: 1,
				},
				limit: {
					type: "number",
					description: "Itens por página",
					example: 10,
					default: 10,
				},
			},
		},
		response: {
			200: {
				description: "Visitas encontradas com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							data: {
								type: "array",
								items: {
									type: "object",
									properties: {
										_id: { type: "string" },
										visitorId: { type: "string" },
										apartmentId: { type: "string" },
										note: { type: "string" },
										registeredBy: { type: "string" },
										registeredAt: { type: "string", format: "date-time" },
										buildingId: { type: "string" },
										createdAt: { type: "string", format: "date-time" },
										updatedAt: { type: "string", format: "date-time" },
										apartmentNumber: {
											type: "string",
											description: "Número do apartamento",
										},
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
							total: { type: "number" },
							page: { type: "number" },
							limit: { type: "number" },
							totalPages: { type: "number" },
						},
					},
				},
			},
			404: {
				description: "Visitante não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			403: {
				description: "Você não tem permissão para acessar este recurso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			401: {
				description: "Token de autenticação inválido ou não fornecido",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public listRecent = {
		querystring: {
			type: "object",
			properties: {
				limit: {
					type: "number",
					description: "Número máximo de visitas a retornar",
					example: 10,
					default: 10,
					minimum: 1,
					maximum: 100,
				},
			},
		},
		response: {
			200: {
				description: "Visitas recentes encontradas com sucesso",
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
								visitorId: { type: "string" },
								apartmentId: { type: "string" },
								note: { type: "string" },
								registeredBy: { type: "string" },
								registeredAt: { type: "string", format: "date-time" },
								buildingId: { type: "string" },
								createdAt: { type: "string", format: "date-time" },
								updatedAt: { type: "string", format: "date-time" },
								visitor: {
									type: "object",
									properties: {
										_id: { type: "string" },
										name: { type: "string" },
										email: { type: "string" },
										phone: { type: "string" },
										photoUrl: { type: "string" },
									},
								},
								apartment: {
									type: "object",
									nullable: true,
									properties: {
										_id: { type: "string" },
										number: { type: "string" },
										floor: { type: "number" },
										block: { type: "string" },
									},
								},
							},
						},
					},
				},
			},
			403: {
				description: "Você não tem permissão para acessar este recurso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			401: {
				description: "Token de autenticação inválido ou não fornecido",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};
}

