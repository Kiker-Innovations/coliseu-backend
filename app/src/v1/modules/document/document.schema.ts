import {
	protectedSchema,
	unauthorizedResponse,
	forbiddenResponse,
} from "../../utils/schemaHelper";

export class DocumentSchema {
	public create = protectedSchema({
		body: {
			type: "object",
			required: ["name", "description", "fileName", "fileSize", "mimeType"],
			properties: {
				name: {
					type: "string",
					description: "Nome do documento",
					example: "Regimento Interno 2025",
				},
				description: {
					type: "string",
					description: "Descrição do documento",
					example:
						"Documento completo com as regras e regulamentos do condomínio",
				},
				fileName: {
					type: "string",
					description: "Nome do arquivo original",
					example: "regimento-interno-2025.pdf",
				},
				fileSize: {
					type: "number",
					description: "Tamanho do arquivo em bytes",
					example: 2621440,
				},
				mimeType: {
					type: "string",
					description: "Tipo MIME do arquivo",
					example: "application/pdf",
				},
			},
		},
		response: {
			201: {
				description: "Documento criado com sucesso",
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
							url: { type: "string" },
							presignedUrl: { type: "string" },
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
				description: "Documentos encontrados",
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
								description: { type: "string" },
								url: { type: "string" },
								fileName: { type: "string" },
								fileSize: { type: "number" },
								createdAt: { type: "string" },
							},
						},
					},
				},
			},
			...unauthorizedResponse,
		},
	});

	public getById = protectedSchema({
		params: {
			type: "object",
			required: ["id"],
			properties: {
				id: {
					type: "string",
					description: "ID do documento",
				},
			},
		},
		response: {
			200: {
				description: "Documento encontrado",
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
							url: { type: "string" },
							fileName: { type: "string" },
							fileSize: { type: "number" },
							createdAt: { type: "string" },
						},
					},
				},
			},
			404: {
				description: "Documento não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			...unauthorizedResponse,
		},
	});

	public update = protectedSchema({
		params: {
			type: "object",
			required: ["id"],
			properties: {
				id: {
					type: "string",
					description: "ID do documento",
				},
			},
		},
		body: {
			type: "object",
			properties: {
				name: {
					type: "string",
					description: "Nome do documento",
					example: "Regimento Interno 2025 - Atualizado",
				},
				description: {
					type: "string",
					description: "Descrição do documento",
					example: "Documento atualizado com as novas regras",
				},
			},
		},
		response: {
			200: {
				description: "Documento atualizado com sucesso",
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
							url: { type: "string" },
						},
					},
				},
			},
			404: {
				description: "Documento não encontrado",
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
					description: "ID do documento",
				},
			},
		},
		response: {
			200: {
				description: "Documento deletado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			404: {
				description: "Documento não encontrado",
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
