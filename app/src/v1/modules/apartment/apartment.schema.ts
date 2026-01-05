export class ApartmentSchema {
	public create = {
		body: {
			type: "object",
			required: ["buildingId", "number", "block", "floor", "status"],
			properties: {
				buildingId: {
					type: "string",
					description: "ID do edifício (UUID)",
					example: "b2ce3bcd-6309-42a5-861c-33bdefb7ab33",
				},
				number: {
					type: "string",
					description: "Número do apartamento",
					example: "101",
				},
				block: {
					type: "string",
					description: "Bloco/torre",
					example: "Bloco A",
				},
				floor: {
					type: "number",
					description: "Andar",
					example: 1,
				},
				status: {
					type: "string",
					description: "Status do apartamento",
					example: "disponível",
				},
			},
		},
		response: {
			201: {
				description: "Apartamento criado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							id: { type: "string" },
							buildingId: { type: "string" },
							number: { type: "string" },
							block: { type: "string" },
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
		},
	};

	public getById = {
		params: {
			type: "object",
			required: ["id"],
			properties: {
				id: {
					type: "string",
					description: "ID do apartamento",
				},
			},
		},
		response: {
			200: {
				description: "Apartamento encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							buildingId: { type: "string" },
							number: { type: "string" },
							block: { type: "string" },
							floor: { type: "number" },
							status: { type: "string" },
							createdAt: { type: "string", format: "date-time" },
							updatedAt: { type: "string", format: "date-time" },
						},
					},
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

	public getAllByBuilding = {
		querystring: {
			type: "object",
			required: ["buildingId"],
			properties: {
				buildingId: {
					type: "string",
					description: "ID do edifício (UUID)",
					example: "b2ce3bcd-6309-42a5-861c-33bdefb7ab33",
				},
			},
		},
		response: {
			200: {
				description: "Apartamentos encontrados",
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
								buildingId: { type: "string" },
								number: { type: "string" },
								block: { type: "string" },
								floor: { type: "number" },
								status: { type: "string" },
								createdAt: { type: "string", format: "date-time" },
								updatedAt: { type: "string", format: "date-time" },
							},
						},
					},
				},
			},
			400: {
				description: "buildingId não fornecido",
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
					description: "ID do apartamento",
				},
			},
		},
		body: {
			type: "object",
			properties: {
				buildingId: {
					type: "string",
					description: "ID do edifício (UUID)",
					example: "b2ce3bcd-6309-42a5-861c-33bdefb7ab33",
				},
				number: {
					type: "string",
					description: "Número do apartamento",
					example: "101",
				},
				block: {
					type: "string",
					description: "Bloco/torre",
					example: "Bloco A",
				},
				floor: {
					type: "number",
					description: "Andar",
					example: 1,
				},
				status: {
					type: "string",
					description: "Status do apartamento",
					example: "disponível",
				},
			},
		},
		response: {
			200: {
				description: "Apartamento atualizado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							buildingId: { type: "string" },
							number: { type: "string" },
							block: { type: "string" },
							floor: { type: "number" },
							status: { type: "string" },
							createdAt: { type: "string", format: "date-time" },
							updatedAt: { type: "string", format: "date-time" },
						},
					},
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

	public remove = {
		params: {
			type: "object",
			required: ["id"],
			properties: {
				id: {
					type: "string",
					description: "ID do apartamento",
				},
			},
		},
		response: {
			200: {
				description: "Apartamento deletado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: { type: "null" },
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
}

