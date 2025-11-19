export class PollSchema {
	public create = {
		body: {
			type: "object",
			required: [
				"buildingId",
				"description",
				"options",
				"startDate",
				"endDate",
			],
			properties: {
				buildingId: {
					type: "string",
					format: "uuid",
					description: "ID do edifício",
					example: "123e4567-e89b-12d3-a456-426614174000",
				},
				description: {
					type: "string",
					description: "Descrição da enquete",
					example: "Qual a melhor opção para o novo sistema de segurança?",
				},
				options: {
					type: "array",
					items: {
						type: "string",
					},
					minItems: 2,
					maxItems: 10,
					description: "Array de opções da enquete (mínimo 2, máximo 10)",
					example: ["Opção A", "Opção B", "Opção C"],
				},
				startDate: {
					type: "string",
					format: "date-time",
					description: "Data e hora de início da enquete (ISO 8601). O status será determinado automaticamente: PROGRAMADO se a data for futura, ATIVO se for hoje ou passado",
					example: "2025-01-15T10:00:00Z",
				},
				endDate: {
					type: "string",
					format: "date-time",
					description: "Data e hora de término da enquete (ISO 8601)",
					example: "2025-01-20T23:59:59Z",
				},
			},
		},
		response: {
			201: {
				description: "Enquete criada com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							id: { type: "string" },
							description: { type: "string" },
							status: { type: "string" },
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
				description: "Edifício não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public getActive = {
		querystring: {
			type: "object",
			required: ["buildingId", "month", "year"],
			properties: {
				buildingId: {
					type: "string",
					format: "uuid",
					description: "ID do edifício",
					example: "123e4567-e89b-12d3-a456-426614174000",
				},
				month: {
					type: "integer",
					minimum: 1,
					maximum: 12,
					description: "Mês (1-12)",
					example: 1,
				},
				year: {
					type: "integer",
					minimum: 2000,
					maximum: 2100,
					description: "Ano",
					example: 2025,
				},
			},
		},
		response: {
			200: {
				description: "Enquetes ativas encontradas",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "array",
						items: {
							type: "object",
							properties: {
								description: { type: "string" },
								startDate: { type: "string", format: "date-time" },
								endDate: { type: "string", format: "date-time" },
								votes: { type: "integer" },
								options: {
									type: "array",
									items: {
										type: "object",
										properties: {
											description: { type: "string" },
											votes: { type: "integer" },
											percent: { type: "number" },
										},
									},
								},
								status: { type: "string" },
							},
						},
					},
				},
			},
			404: {
				description: "Nenhuma enquete ativa encontrada",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public getFinishedAndCancelled = {
		querystring: {
			type: "object",
			required: ["buildingId", "month", "year"],
			properties: {
				buildingId: {
					type: "string",
					format: "uuid",
					description: "ID do edifício",
					example: "123e4567-e89b-12d3-a456-426614174000",
				},
				month: {
					type: "integer",
					minimum: 1,
					maximum: 12,
					description: "Mês (1-12)",
					example: 1,
				},
				year: {
					type: "integer",
					minimum: 2000,
					maximum: 2100,
					description: "Ano",
					example: 2025,
				},
			},
		},
		response: {
			200: {
				description: "Enquetes encerradas e canceladas encontradas",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "array",
						items: {
							type: "object",
							properties: {
								description: { type: "string" },
								startDate: { type: "string", format: "date-time" },
								endDate: { type: "string", format: "date-time" },
								votes: { type: "integer" },
								options: {
									type: "array",
									items: {
										type: "object",
										properties: {
											description: { type: "string" },
											votes: { type: "integer" },
											percent: { type: "number" },
										},
									},
								},
								status: { type: "string" },
								cancelReason: { type: "string" },
								cancelledAt: { type: "string", format: "date-time" },
							},
						},
					},
				},
			},
			404: {
				description: "Nenhuma enquete encerrada ou cancelada encontrada",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public getActiveStats = {
		querystring: {
			type: "object",
			required: ["buildingId", "month", "year"],
			properties: {
				buildingId: {
					type: "string",
					format: "uuid",
					description: "ID do edifício",
					example: "123e4567-e89b-12d3-a456-426614174000",
				},
				month: {
					type: "integer",
					minimum: 1,
					maximum: 12,
					description: "Mês (1-12)",
					example: 1,
				},
				year: {
					type: "integer",
					minimum: 2000,
					maximum: 2100,
					description: "Ano",
					example: 2025,
				},
			},
		},
		response: {
			200: {
				description: "Estatísticas de enquetes ativas encontradas",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							totalPolls: {
								type: "integer",
								description: "Total de enquetes com status ATIVO",
							},
							totalVotes: {
								type: "integer",
								description: "Total de votos de todas as enquetes ativas",
							},
							totalPercent: {
								type: "number",
								description: "Percentual de votos em relação ao total de residents cadastrados",
							},
						},
					},
				},
			},
			404: {
				description: "Edifício não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};
}

