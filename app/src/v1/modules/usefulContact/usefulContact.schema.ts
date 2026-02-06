import {
	protectedSchema,
	unauthorizedResponse,
	forbiddenResponse,
} from "../../utils/schemaHelper";

export class UsefulContactSchema {
	public create = protectedSchema({
		body: {
			type: "object",
			required: ["name", "phone"],
			properties: {
				name: {
					type: "string",
					description: "Nome do contato",
					example: "Bombeiros",
					minLength: 2,
					maxLength: 100,
				},
				phone: {
					type: "string",
					description: "Telefone do contato",
					example: "(11) 99999-9999",
					minLength: 10,
					maxLength: 20,
				},
				observation: {
					type: "string",
					description: "Observação sobre o contato",
					example: "Emergência 24h",
					maxLength: 500,
				},
			},
		},
		response: {
			201: {
				description: "Contato útil criado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							name: { type: "string" },
							phone: { type: "string" },
							observation: { type: "string" },
							createdAt: { type: "string" },
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
			...unauthorizedResponse,
			...forbiddenResponse,
		},
	});

	public getAll = protectedSchema({
		response: {
			200: {
				description: "Lista de contatos úteis",
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
								observation: { type: "string" },
								createdAt: { type: "string" },
							},
						},
					},
				},
			},
			...unauthorizedResponse,
			...forbiddenResponse,
		},
	});

	public getById = protectedSchema({
		params: {
			type: "object",
			required: ["id"],
			properties: {
				id: {
					type: "string",
					description: "ID do contato útil",
					example: "123e4567-e89b-12d3-a456-426614174000",
				},
			},
		},
		response: {
			200: {
				description: "Contato útil encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							name: { type: "string" },
							phone: { type: "string" },
							observation: { type: "string" },
							createdAt: { type: "string" },
							updatedAt: { type: "string" },
						},
					},
				},
			},
			404: {
				description: "Contato útil não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			...unauthorizedResponse,
			...forbiddenResponse,
		},
	});

	public update = protectedSchema({
		params: {
			type: "object",
			required: ["id"],
			properties: {
				id: {
					type: "string",
					description: "ID do contato útil",
					example: "123e4567-e89b-12d3-a456-426614174000",
				},
			},
		},
		body: {
			type: "object",
			properties: {
				name: {
					type: "string",
					description: "Nome do contato",
					example: "Bombeiros",
					minLength: 2,
					maxLength: 100,
				},
				phone: {
					type: "string",
					description: "Telefone do contato",
					example: "(11) 99999-9999",
					minLength: 10,
					maxLength: 20,
				},
				observation: {
					type: "string",
					description: "Observação sobre o contato",
					example: "Emergência 24h",
					maxLength: 500,
				},
			},
		},
		response: {
			200: {
				description: "Contato útil atualizado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							name: { type: "string" },
							phone: { type: "string" },
							observation: { type: "string" },
							updatedAt: { type: "string" },
						},
					},
				},
			},
			404: {
				description: "Contato útil não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			...unauthorizedResponse,
			...forbiddenResponse,
		},
	});

	public delete = protectedSchema({
		params: {
			type: "object",
			required: ["id"],
			properties: {
				id: {
					type: "string",
					description: "ID do contato útil",
					example: "123e4567-e89b-12d3-a456-426614174000",
				},
			},
		},
		response: {
			200: {
				description: "Contato útil excluído com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			404: {
				description: "Contato útil não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			...unauthorizedResponse,
			...forbiddenResponse,
		},
	});
}
