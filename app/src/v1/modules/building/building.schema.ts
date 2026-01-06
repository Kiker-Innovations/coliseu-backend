export class BuildingSchema {
	public create = {
		body: {
			type: "object",
			required: [
				"name",
				"cnpj",
				"state",
				"city",
				"address",
				"addressNumber",
				"zipCode",
				"phone",
				"floorCount",
			],
			properties: {
				name: {
					type: "string",
					description: "Nome do edifício",
					example: "Edifício Central Park",
				},
				cnpj: {
					type: "string",
					description: "CNPJ do edifício",
					example: "00.000.000/0000-00",
				},
				state: {
					type: "string",
					description: "Estado (UF)",
					example: "SP",
				},
				city: {
					type: "string",
					description: "Cidade",
					example: "São Paulo",
				},
				address: {
					type: "string",
					description: "Endereço",
					example: "Avenida Paulista",
				},
				addressNumber: {
					type: "number",
					description: "Número do endereço",
					example: 1000,
				},
				zipCode: {
					type: "string",
					description: "CEP",
					example: "01310-100",
				},
				complement: {
					type: "string",
					description: "Complemento",
					example: "Próximo ao metrô",
				},
				phone: {
					type: "string",
					description: "Telefone",
					example: "(11) 98765-4321",
				},
				floorCount: {
					type: "number",
					description: "Número de andares",
					example: 20,
				},
			},
		},
		response: {
			201: {
				description: "Edifício criado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							id: { type: "string" },
							name: { type: "string" },
							cnpj: { type: "string" },
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
			409: {
				description: "CNPJ já cadastrado",
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
					description: "ID do edifício",
				},
			},
		},
		response: {
			200: {
				description: "Edifício encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							name: { type: "string" },
							cnpj: { type: "string" },
							state: { type: "string" },
							city: { type: "string" },
							address: { type: "string" },
							addressNumber: { type: "number" },
							zipCode: { type: "string" },
							complement: { type: "string" },
							phone: { type: "string" },
							floorCount: { type: "number" },
							createdAt: { type: "string", format: "date-time" },
							updatedAt: { type: "string", format: "date-time" },
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

	public getAll = {
		response: {
			200: {
				description: "Edifícios encontrados",
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
								cnpj: { type: "string" },
								state: { type: "string" },
								city: { type: "string" },
								address: { type: "string" },
								addressNumber: { type: "number" },
								zipCode: { type: "string" },
								complement: { type: "string" },
								phone: { type: "string" },
								floorCount: { type: "number" },
								createdAt: { type: "string", format: "date-time" },
								updatedAt: { type: "string", format: "date-time" },
							},
						},
					},
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
					description: "ID do edifício",
				},
			},
		},
		body: {
			type: "object",
			properties: {
				name: {
					type: "string",
					description: "Nome do edifício",
					example: "Edifício Central Park",
				},
				cnpj: {
					type: "string",
					description: "CNPJ do edifício",
					example: "00.000.000/0000-00",
				},
				state: {
					type: "string",
					description: "Estado (UF)",
					example: "SP",
				},
				city: {
					type: "string",
					description: "Cidade",
					example: "São Paulo",
				},
				address: {
					type: "string",
					description: "Endereço",
					example: "Avenida Paulista",
				},
				addressNumber: {
					type: "number",
					description: "Número do endereço",
					example: 1000,
				},
				zipCode: {
					type: "string",
					description: "CEP",
					example: "01310-100",
				},
				complement: {
					type: "string",
					description: "Complemento",
					example: "Próximo ao metrô",
				},
				phone: {
					type: "string",
					description: "Telefone",
					example: "(11) 98765-4321",
				},
				floorCount: {
					type: "number",
					description: "Número de andares",
					example: 20,
				},
			},
		},
		response: {
			200: {
				description: "Edifício atualizado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							name: { type: "string" },
							cnpj: { type: "string" },
							state: { type: "string" },
							city: { type: "string" },
							address: { type: "string" },
							addressNumber: { type: "number" },
							zipCode: { type: "string" },
							complement: { type: "string" },
							phone: { type: "string" },
							floorCount: { type: "number" },
							createdAt: { type: "string", format: "date-time" },
							updatedAt: { type: "string", format: "date-time" },
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
			409: {
				description: "CNPJ já cadastrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public remove = {
		params: {
			type: "object",
			required: ["id"],
			properties: {
				id: {
					type: "string",
					description: "ID do edifício",
				},
			},
		},
		response: {
			200: {
				description: "Edifício deletado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: { type: "null" },
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
