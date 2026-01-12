export class VisitorSchema {
	public create = {
		body: {
			type: "object",
			required: ["name", "types"],
			properties: {
				name: {
					type: "string",
					description: "Nome completo do visitante (mín. 3 caracteres)",
					example: "João Silva",
				},
				email: {
					type: "string",
					format: "email",
					description: "Email do visitante",
					example: "visitante@example.com",
				},
				document: {
					type: "string",
					description: "CPF ou RG do visitante",
					example: "12345678900",
				},
				phone: {
					type: "string",
					description: "Telefone de contato",
					example: "(13) 97408-0222",
				},
				vehicleType: {
					type: "string",
					enum: ["CARRO", "MOTO"],
					description: "Tipo de veículo (CARRO ou MOTO)",
					example: "CARRO",
				},
				vehiclePlate: {
					type: "string",
					description: "Placa do veículo (formato: ABC1234 ou ABC1D23)",
					example: "ABC1234",
				},
				types: {
					type: "array",
					items: {
						type: "string",
						enum: ["CONVIDADO", "PRESTADOR"],
					},
					description: "Tipos de visitante (mín. 1 item)",
					example: ["CONVIDADO"],
				},
				companyName: {
					type: "string",
					description: "Nome da empresa (opcional, apenas para prestadores)",
					example: "Empresa ABC Ltda",
				},
				note: {
					type: "string",
					description: "Observações sobre o visitante",
					example: "Visitante frequente",
				},
			},
		},
		response: {
			201: {
				description: "Visitante criado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							name: { type: "string" },
							email: { type: "string" },
							phone: { type: "string" },
							presignedUrl: {
								type: "string",
								description: "URL pré-assinada para upload da foto",
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

	public list = {
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
				search: {
					type: "string",
					description: "Termo de busca",
					example: "João",
				},
				filterBy: {
					type: "string",
					enum: ["name", "document", "apartment"],
					description: "Tipo de filtro",
					example: "name",
				},
			},
		},
		response: {
			200: {
				description: "Visitantes encontrados com sucesso",
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
										name: { type: "string" },
										phone: { type: "string" },
										vehicleType: { type: "string" },
										vehiclePlate: { type: "string" },
										types: {
											type: "array",
											items: {
												type: "string",
												enum: ["CONVIDADO", "PRESTADOR"],
											},
										},
										photoUrl: { type: "string" },
										note: { type: "string" },
										active: { type: "boolean" },
										apartmentNumber: { type: "string" },
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
			401: {
				description: "Token de autenticação inválido ou não fornecido",
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
					description: "ID do visitante",
				},
			},
		},
		response: {
			200: {
				description: "Visitante encontrado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							name: { type: "string" },
							email: { type: "string" },
							document: { type: "string" },
							phone: { type: "string" },
							vehicleType: { type: "string" },
							vehiclePlate: { type: "string" },
							apartmentId: { type: "string" },
							apartmentNumber: { type: "string" },
							types: {
								type: "array",
								items: { type: "string", enum: ["CONVIDADO", "PRESTADOR"] },
							},
							photoUrl: { type: "string" },
							note: { type: "string" },
							registeredBy: { type: "string" },
							registeredAt: { type: "string", format: "date-time" },
							updatedBy: { type: "string" },
							buildingId: { type: "string" },
							active: { type: "boolean" },
							createdAt: { type: "string", format: "date-time" },
							updatedAt: { type: "string", format: "date-time" },
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

	public update = {
		params: {
			type: "object",
			required: ["id"],
			properties: {
				id: {
					type: "string",
					format: "uuid",
					description: "ID do visitante",
				},
			},
		},
		body: {
			type: "object",
			properties: {
				name: {
					type: "string",
					description: "Nome completo do visitante (mín. 3 caracteres)",
					example: "João Silva",
				},
				email: {
					type: "string",
					format: "email",
					description: "Email do visitante",
					example: "visitante@example.com",
				},
				document: {
					type: "string",
					description: "CPF ou RG do visitante",
					example: "12345678900",
				},
				phone: {
					type: "string",
					description: "Telefone de contato",
					example: "(13) 97408-0222",
				},
				vehicleType: {
					type: "string",
					enum: ["CARRO", "MOTO"],
					description: "Tipo de veículo (CARRO ou MOTO)",
					example: "CARRO",
				},
				vehiclePlate: {
					type: "string",
					description: "Placa do veículo (formato: ABC1234 ou ABC1D23)",
					example: "ABC1234",
				},
				types: {
					type: "array",
					items: {
						type: "string",
						enum: ["CONVIDADO", "PRESTADOR"],
					},
					description: "Tipos de visitante (mín. 1 item)",
					example: ["CONVIDADO"],
				},
				companyName: {
					type: "string",
					description: "Nome da empresa (opcional, apenas para prestadores)",
					example: "Empresa ABC Ltda",
				},
				note: {
					type: "string",
					description: "Observações sobre o visitante",
					example: "Visitante frequente",
				},
				active: {
					type: "boolean",
					description: "Status ativo/inativo do visitante",
					example: true,
				},
			},
		},
		response: {
			200: {
				description: "Visitante atualizado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							name: { type: "string" },
							email: { type: "string" },
							document: { type: "string" },
							phone: { type: "string" },
							vehicleType: { type: "string" },
							vehiclePlate: { type: "string" },
							apartmentId: { type: "string" },
							types: {
								type: "array",
								items: { type: "string", enum: ["CONVIDADO", "PRESTADOR"] },
							},
							photoUrl: { type: "string" },
							note: { type: "string" },
							registeredBy: { type: "string" },
							registeredAt: { type: "string", format: "date-time" },
							updatedBy: { type: "string" },
							buildingId: { type: "string" },
							active: { type: "boolean" },
							createdAt: { type: "string", format: "date-time" },
							updatedAt: { type: "string", format: "date-time" },
							apartmentNumber: { type: "string" },
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
					description: "Número máximo de visitantes a retornar",
					example: 10,
					default: 10,
					minimum: 1,
					maximum: 100,
				},
			},
		},
		response: {
			200: {
				description: "Últimos visitantes encontrados com sucesso",
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
								name: { type: "string" },
								phone: { type: "string" },
								vehicleType: { type: "string" },
								vehiclePlate: { type: "string" },
								apartmentId: { type: "string" },
								types: {
									type: "array",
									items: {
										type: "string",
										enum: ["CONVIDADO", "PRESTADOR"],
									},
								},
								photoUrl: { type: "string" },
								note: { type: "string" },
								active: { type: "boolean" },
								apartmentNumber: { type: "string" },
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
