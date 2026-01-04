import {
	protectedSchema,
	unauthorizedResponse,
	forbiddenResponse,
} from "../../utils/schemaHelper";

export class FineSchema {
	public create = protectedSchema({
		body: {
			type: "object",
			required: ["name", "description", "value"],
			properties: {
				name: {
					type: "string",
					description: "Nome da multa",
					example: "Barulho após às 22h",
				},
				description: {
					type: "string",
					description: "Descrição da multa",
					example: "Fazer barulho excessivo após às 22h é proibido conforme o regimento interno.",
				},
				value: {
					type: "number",
					description: "Valor da multa em reais",
					example: 150.0,
				},
			},
		},
		response: {
			201: {
				description: "Multa criada com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							name: { type: "string" },
							description: { type: "string" },
							value: { type: "number" },
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
				description: "Multas encontradas",
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
								name: { type: "string" },
								description: { type: "string" },
								value: { type: "number" },
								createdAt: { type: "string", format: "date-time" },
								updatedAt: { type: "string", format: "date-time" },
							},
						},
					},
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
					description: "ID da multa",
				},
			},
		},
		body: {
			type: "object",
			properties: {
				name: {
					type: "string",
					description: "Nome da multa",
					example: "Barulho após às 22h",
				},
				description: {
					type: "string",
					description: "Descrição da multa",
					example: "Fazer barulho excessivo após às 22h é proibido conforme o regimento interno.",
				},
				value: {
					type: "number",
					description: "Valor da multa em reais",
					example: 150.0,
				},
			},
		},
		response: {
			200: {
				description: "Multa atualizada com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							buildingId: { type: "string" },
							name: { type: "string" },
							description: { type: "string" },
							value: { type: "number" },
							createdAt: { type: "string", format: "date-time" },
							updatedAt: { type: "string", format: "date-time" },
						},
					},
				},
			},
			404: {
				description: "Multa não encontrada",
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

	public remove = protectedSchema({
		params: {
			type: "object",
			required: ["id"],
			properties: {
				id: {
					type: "string",
					description: "ID da multa",
				},
			},
		},
		response: {
			200: {
				description: "Multa deletada com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: { type: "null" },
				},
			},
			404: {
				description: "Multa não encontrada",
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
