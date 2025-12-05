export class ProjectOfferSchema {
	private offerResponse = {
		type: "object",
		properties: {
			_id: { type: "string" },
			buildingId: { type: "string" },
			seasonId: { type: "string" },
			projectId: { type: "string" },
			companyName: { type: "string" },
			description: { type: "string" },
			companyCnpj: { type: "string" },
			totalValue: { type: "number" },
			installmentsCount: { type: "number" },
			paidInstallments: { type: ["number", "null"] },
			votes: { type: "number" },
			paymentStartDate: { type: ["string", "null"], format: "date-time" },
			createdAt: { type: "string", format: "date-time" },
			updatedAt: { type: "string", format: "date-time" },
		},
	};

	private offerInput = {
		type: "object",
		required: ["companyName", "description", "companyCnpj", "totalValue", "installmentsCount"],
		properties: {
			companyName: {
				type: "string",
				minLength: 2,
				maxLength: 100,
				description: "Nome da empresa",
				example: "Construtora ABC Ltda",
			},
			description: {
				type: "string",
				minLength: 10,
				maxLength: 1000,
				description: "Descrição da oferta",
				example: "Serviço completo de reforma com garantia de 2 anos",
			},
			companyCnpj: {
				type: "string",
				description: "CNPJ da empresa (apenas números)",
				example: "12345678000190",
			},
			totalValue: {
				type: "number",
				minimum: 0,
				description: "Valor total da oferta",
				example: 50000.00,
			},
			installmentsCount: {
				type: "integer",
				minimum: 1,
				maximum: 120,
				description: "Número de parcelas",
				example: 12,
			},
		},
	};

	public create = {
		body: {
			type: "object",
			required: ["projectId", "offerStartDate", "offerEndDate", "offers"],
			properties: {
				projectId: {
					type: "string",
					format: "uuid",
					description: "ID do projeto ao qual as ofertas pertencem",
				},
				offerStartDate: {
					type: "string",
					format: "date-time",
					description: "Data de início do período de votação das ofertas",
					example: "2024-01-15T00:00:00.000Z",
				},
				offerEndDate: {
					type: "string",
					format: "date-time",
					description: "Data de término do período de votação das ofertas",
					example: "2024-02-15T23:59:59.000Z",
				},
				offers: {
					type: "array",
					minItems: 2,
					maxItems: 10,
					description: "Lista de ofertas (mínimo 2, máximo 10)",
					items: this.offerInput,
				},
			},
		},
		response: {
			201: {
				description: "Ofertas criadas com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "array",
						items: this.offerResponse,
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
				description: "Projeto não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public getAllByProject = {
		params: {
			type: "object",
			required: ["projectId"],
			properties: {
				projectId: {
					type: "string",
					format: "uuid",
					description: "ID do projeto",
				},
			},
		},
		response: {
			200: {
				description: "Ofertas encontradas",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "array",
						items: this.offerResponse,
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
				description: "Projeto não encontrado",
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
					description: "ID da oferta",
				},
			},
		},
		response: {
			200: {
				description: "Oferta encontrada",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: this.offerResponse,
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
				description: "Oferta não encontrada",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public deleteByProject = {
		params: {
			type: "object",
			required: ["projectId"],
			properties: {
				projectId: {
					type: "string",
					format: "uuid",
					description: "ID do projeto",
				},
			},
		},
		response: {
			200: {
				description: "Ofertas deletadas com sucesso",
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

