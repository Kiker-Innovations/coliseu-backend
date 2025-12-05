export class ResidentSuggestionSchema {
	public create = {
		body: {
			type: "object",
			required: ["title", "description"],
			properties: {
				title: {
					type: "string",
					description: "Título da sugestão",
					minLength: 3,
					maxLength: 100,
					example: "Melhorias no sistema de coleta de lixo",
				},
				description: {
					type: "string",
					description: "Descrição detalhada da sugestão",
					minLength: 10,
					maxLength: 1000,
					example:
						"Sugiro a implementação de um sistema de coleta seletiva mais eficiente, com horários específicos para cada tipo de resíduo.",
				},
			},
		},
		response: {
			201: {
				description: "Sugestão criada com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							apartmentId: { type: "string" },
							buildingId: { type: "string" },
							title: { type: "string" },
							description: { type: "string" },
							createdAt: { type: "string", format: "date-time" },
							updatedAt: { type: "string", format: "date-time" },
						},
					},
				},
			},
			400: {
				description: "Dados inválidos ou limite de sugestões atingido",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			401: {
				description: "Usuário não autenticado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			403: {
				description: "Acesso negado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			404: {
				description: "Apartamento não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public getAll = {
		response: {
			200: {
				description: "Sugestões do apartamento encontradas",
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
								fromSeasonId: { type: "string" },
								actualSeasonId: { type: "string" },
								title: { type: "string" },
								description: { type: "string" },
								createdAt: { type: "string", format: "date-time" },
								updatedAt: { type: "string", format: "date-time" },
							},
						},
					},
				},
			},
			401: {
				description: "Usuário não autenticado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			403: {
				description: "Acesso negado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
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
					description: "ID da sugestão",
				},
			},
		},
		response: {
			200: {
				description: "Sugestão encontrada",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							apartmentId: { type: "string" },
							buildingId: { type: "string" },
							title: { type: "string" },
							description: { type: "string" },
							createdAt: { type: "string", format: "date-time" },
							updatedAt: { type: "string", format: "date-time" },
						},
					},
				},
			},
			401: {
				description: "Usuário não autenticado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			403: {
				description: "Acesso negado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			404: {
				description: "Sugestão não encontrada",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public update = {
		params: {
			type: "object",
			required: ["id"],
			properties: {
				id: {
					type: "string",
					format: "uuid",
					description: "ID da sugestão",
				},
			},
		},
		body: {
			type: "object",
			properties: {
				title: {
					type: "string",
					description: "Título da sugestão",
					minLength: 3,
					maxLength: 100,
					example: "Melhorias no sistema de coleta de lixo",
				},
				description: {
					type: "string",
					description: "Descrição detalhada da sugestão",
					minLength: 10,
					maxLength: 1000,
					example:
						"Sugiro a implementação de um sistema de coleta seletiva mais eficiente.",
				},
			},
		},
		response: {
			200: {
				description: "Sugestão atualizada com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							apartmentId: { type: "string" },
							buildingId: { type: "string" },
							title: { type: "string" },
							description: { type: "string" },
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
				},
			},
			401: {
				description: "Usuário não autenticado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			403: {
				description: "Acesso negado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			404: {
				description: "Sugestão não encontrada",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public delete = {
		params: {
			type: "object",
			required: ["id"],
			properties: {
				id: {
					type: "string",
					format: "uuid",
					description: "ID da sugestão",
				},
			},
		},
		response: {
			200: {
				description: "Sugestão deletada com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: { type: "null" },
				},
			},
			401: {
				description: "Usuário não autenticado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			403: {
				description: "Acesso negado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			404: {
				description: "Sugestão não encontrada",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};
}