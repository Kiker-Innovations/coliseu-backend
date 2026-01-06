export class ProjectSchema {
	private projectResponse = {
		type: "object",
		properties: {
			_id: { type: "string" },
			buildingId: { type: "string" },
			fromSeasonId: { type: "string" },
			chosenOfferId: { type: ["string", "null"] },
			title: { type: "string" },
			description: { type: "string" },
			offerStartDate: { type: ["string", "null"] },
			offerEndDate: { type: ["string", "null"] },
			votes: { type: "number" },
			rank: { type: ["number", "null"] },
			offer: {
				type: "object",
				properties: {
					companyName: { type: "string" },
					description: { type: "string" },
					companyCnpj: { type: "string" },
					totalValue: { type: "number" },
					installmentsCount: { type: "number" },
					paidInstallments: { type: ["number", "null"] },
					votes: { type: "number" },
					paymentStartDate: { type: ["string", "null"] },
				},
			},
			createdAt: { type: "string", format: "date-time" },
			updatedAt: { type: "string", format: "date-time" },
		},
	};

	private projectWithOfferResponse = {
		type: "object",
		properties: {
			title: { type: "string" },
			description: { type: "string" },
			votes: { type: "number" },
			rank: { type: ["number", "null"] },
			offer: {
				type: "object",
				properties: {
					companyName: { type: "string" },
					description: { type: "string" },
					companyCnpj: { type: "string" },
					totalValue: { type: "number" },
					installmentsCount: { type: "number" },
					paidInstallments: { type: ["number", "null"] },
					votes: { type: "number" },
					paymentStartDate: { type: ["string", "null"], format: "date-time" },
				},
			},
		},
	};

	public create = {
		body: {
			type: "object",
			required: ["title", "description"],
			properties: {
				title: {
					type: "string",
					minLength: 3,
					maxLength: 100,
					description: "Título do projeto",
					example: "Reforma da Portaria",
				},
				description: {
					type: "string",
					minLength: 10,
					maxLength: 1000,
					description: "Descrição detalhada do projeto",
					example:
						"Reforma completa da portaria incluindo pintura e troca de vidros",
				},
			},
		},
		response: {
			201: {
				description: "Projeto criado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: this.projectResponse,
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
		},
	};

	public getAllByBuildingAndSeason = {
		response: {
			200: {
				description: "Projetos encontrados",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "array",
						items: this.projectResponse,
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
					description: "ID do projeto",
				},
			},
		},
		response: {
			200: {
				description: "Projeto encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: this.projectResponse,
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
				description: "Projeto não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public getPendingPayments = {
		response: {
			200: {
				description: "Projetos com pagamentos pendentes",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "array",
						items: this.projectWithOfferResponse,
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

	public update = {
		params: {
			type: "object",
			required: ["id"],
			properties: {
				id: {
					type: "string",
					format: "uuid",
					description: "ID do projeto",
				},
			},
		},
		body: {
			type: "object",
			properties: {
				title: {
					type: "string",
					minLength: 3,
					maxLength: 100,
					description: "Título do projeto",
					example: "Reforma da Portaria",
				},
				description: {
					type: "string",
					minLength: 10,
					maxLength: 1000,
					description: "Descrição detalhada do projeto",
					example:
						"Reforma completa da portaria incluindo pintura e troca de vidros",
				},
			},
		},
		response: {
			200: {
				description: "Projeto atualizado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: this.projectResponse,
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
				description: "Projeto não encontrado",
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
					description: "ID do projeto",
				},
			},
		},
		response: {
			200: {
				description: "Projeto deletado com sucesso",
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
				description: "Projeto não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};
}
