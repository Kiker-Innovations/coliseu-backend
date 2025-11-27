import {
	protectedSchema,
	unauthorizedResponse,
} from "../../utils/schemaHelper";

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
					example: "b2ce3bcd-6309-42a5-861c-33bdefb7ab33",
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
					format: "date",
					description: "Data de início da enquete (YYYY-MM-DD). O status será determinado automaticamente: PROGRAMADO se a data for futura, ATIVO se for hoje ou passado",
					example: "2025-01-15",
				},
				endDate: {
					type: "string",
					format: "date",
					description: "Data de término da enquete (YYYY-MM-DD)",
					example: "2025-01-20",
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

	public getPollsByStatus = {
		querystring: {
			type: "object",
			required: ["buildingId", "month", "year", "status"],
			properties: {
				buildingId: {
					type: "string",
					format: "uuid",
					description: "ID do edifício",
					example: "b2ce3bcd-6309-42a5-861c-33bdefb7ab33",
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
				status: {
					anyOf: [
						{
							type: "string",
							enum: ["ATIVO", "PROGRAMADO", "FINALIZADO", "CANCELADO"],
						},
						{
							type: "array",
							items: {
								type: "string",
								enum: ["ATIVO", "PROGRAMADO", "FINALIZADO", "CANCELADO"],
							},
							minItems: 1,
							maxItems: 4,
						},
					],
					description: "Status para filtrar as enquetes. Pode ser uma string (ex: ATIVO), string separada por vírgula (ex: ATIVO,PROGRAMADO), ou array (ex: status=ATIVO&status=PROGRAMADO). Valores possíveis: ATIVO, PROGRAMADO, FINALIZADO, CANCELADO",
				},
			},
		},
		response: {
			200: {
				description: "Enquetes encontradas (retorna array vazio se não houver enquetes)",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "array",
						items: {
							type: "object",
							properties: {
								id: { type: "string" },
								description: { type: "string" },
								startDate: { type: "string", format: "date-time" },
								endDate: { type: "string", format: "date-time" },
								votes: { type: "integer" },
								options: {
									type: "array",
									items: {
										type: "object",
										required: ["id", "description", "votes", "percent"],
										properties: {
											id: {
												type: "integer",
												description: "ID único da opção",
												example: 0,
											},
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
					example: "b2ce3bcd-6309-42a5-861c-33bdefb7ab33",
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
				description: "Enquetes ativas encontradas (retorna array vazio se não houver enquetes)",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "array",
						items: {
							type: "object",
							properties: {
								id: { type: "string" },
								description: { type: "string" },
								startDate: { type: "string", format: "date-time" },
								endDate: { type: "string", format: "date-time" },
								votes: { type: "integer" },
								options: {
									type: "array",
									items: {
										type: "object",
										required: ["id", "description", "votes", "percent"],
										properties: {
											id: {
												type: "integer",
												description: "ID único da opção",
												example: 0,
											},
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
				description: "Edifício não encontrado",
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
					example: "b2ce3bcd-6309-42a5-861c-33bdefb7ab33",
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
				description: "Enquetes encerradas e canceladas encontradas (retorna array vazio se não houver enquetes)",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "array",
						items: {
							type: "object",
							properties: {
								id: { type: "string" },
								description: { type: "string" },
								startDate: { type: "string", format: "date-time" },
								endDate: { type: "string", format: "date-time" },
								votes: { type: "integer" },
								options: {
									type: "array",
									items: {
										type: "object",
										required: ["id", "description", "votes", "percent"],
										properties: {
											id: {
												type: "integer",
												description: "ID único da opção",
												example: 0,
											},
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
				description: "Edifício não encontrado",
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
					description: "ID do edifício (UUID)",
					example: "b2ce3bcd-6309-42a5-861c-33bdefb7ab33",
				},
				month: {
					type: "string",
					description: "Mês (1-12)",
					example: "11",
				},
				year: {
					type: "string",
					description: "Ano",
					example: "2025",
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
								description: "Média ponderada considerando: taxa de participação dos residents ativos (60%), quantidade de enquetes ativas (20%) e quantidade de votos (20%)",
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

	public cancel = {
		params: {
			type: "object",
			required: ["id"],
			properties: {
				id: {
					type: "string",
					format: "uuid",
					description: "ID da enquete a ser cancelada",
					example: "b2ce3bcd-6309-42a5-861c-33bdefb7ab33",
				},
			},
		},
		body: {
			type: "object",
			required: ["cancelReason"],
			properties: {
				cancelReason: {
					type: "string",
					description: "Motivo do cancelamento da enquete",
					minLength: 3,
					maxLength: 500,
					example: "Enquete cancelada devido a mudanças no escopo do projeto",
				},
			},
		},
		response: {
			200: {
				description: "Enquete cancelada com sucesso",
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
							cancelReason: { type: "string" },
							cancelledAt: { type: "string", format: "date-time" },
						},
					},
				},
			},
			400: {
				description: "Dados inválidos ou enquete já cancelada/finalizada",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			404: {
				description: "Enquete não encontrada",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public vote = protectedSchema({
		body: {
			type: "object",
			required: ["pollId", "optionId"],
			properties: {
				pollId: {
					type: "string",
					format: "uuid",
					description: "ID da enquete",
					example: "b2ce3bcd-6309-42a5-861c-33bdefb7ab33",
				},
				optionId: {
					type: "integer",
					description: "ID da opção escolhida",
					minimum: 0,
					example: 0,
				},
			},
			description: "O ID do residente é obtido automaticamente do token de autenticação. Não é necessário enviar o residentId no body da requisição.",
		},
		response: {
			200: {
				description: "Voto registrado ou atualizado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							id: { type: "string" },
							pollId: { type: "string" },
							optionId: { type: "integer" },
							createdAt: { type: "string", format: "date-time" },
						},
					},
				},
			},
			400: {
				description: "Dados inválidos ou enquete não está ativa",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			404: {
				description: "Enquete ou opção não encontrada",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			...unauthorizedResponse,
		},
	});

	public deleteVote = {
		params: {
			type: "object",
			required: ["pollId"],
			properties: {
				pollId: {
					type: "string",
					format: "uuid",
					description: "ID da enquete",
					example: "b2ce3bcd-6309-42a5-861c-33bdefb7ab33",
				},
			},
		},
		response: {
			200: {
				description: "Voto deletado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: { type: "null" },
				},
			},
			400: {
				description: "Dados inválidos ou enquete não está ativa",
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
			404: {
				description: "Enquete ou voto não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public getMyVote = {
		params: {
			type: "object",
			required: ["pollId"],
			properties: {
				pollId: {
					type: "string",
					format: "uuid",
					description: "ID da enquete",
					example: "b2ce3bcd-6309-42a5-861c-33bdefb7ab33",
				},
			},
		},
		response: {
			200: {
				description: "Voto do residente encontrado ou null se não votou",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						anyOf: [
							{
								type: "object",
								properties: {
									id: { type: "string" },
									pollId: { type: "string" },
									optionId: { type: "integer" },
									createdAt: { type: "string", format: "date-time" },
									updatedAt: { type: "string", format: "date-time" },
								},
							},
							{ type: "null" },
						],
					},
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
			403: {
				description: "Apenas moradores podem visualizar seus votos",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			404: {
				description: "Enquete ou morador não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};
}

