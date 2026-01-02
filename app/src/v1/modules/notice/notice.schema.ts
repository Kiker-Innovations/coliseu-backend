import {
	protectedSchema,
	unauthorizedResponse,
	forbiddenResponse,
} from "../../utils/schemaHelper";

export class NoticeSchema {
	public create = protectedSchema({
		body: {
			type: "object",
			required: ["title", "content", "fileName", "fileSize", "mimeType"],
			properties: {
				title: {
					type: "string",
					description: "Título do aviso",
					example: "Aviso Importante - Reunião de Condomínio",
				},
				content: {
					type: "string",
					description: "Conteúdo do aviso",
					example: "Informamos que será realizada uma reunião de condomínio no próximo sábado às 10h.",
				},
				fileName: {
					type: "string",
					description: "Nome do arquivo original",
					example: "aviso-reuniao.pdf",
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
				status: {
					type: "string",
					enum: ["ATIVO", "INATIVO"],
					description: "Status do aviso",
					example: "ATIVO",
					default: "ATIVO",
				},
			},
		},
		response: {
			201: {
				description: "Aviso criado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							title: { type: "string" },
							content: { type: "string" },
							url: { type: "string" },
							presignedUrl: { type: "string" },
							status: { type: "string", enum: ["ATIVO", "INATIVO"] },
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
		querystring: {
			type: "object",
			properties: {
				status: {
					type: "string",
					enum: ["ATIVO", "INATIVO"],
					description: "Filtro de status do aviso",
					example: "ATIVO",
				},
				page: {
					type: "number",
					description: "Número da página (começa em 1)",
					example: 1,
					minimum: 1,
				},
				limit: {
					type: "number",
					description: "Quantidade de itens por página",
					example: 10,
					minimum: 1,
					maximum: 100,
				},
			},
		},
		response: {
			200: {
				description: "Avisos encontrados",
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
										title: { type: "string" },
										content: { type: "string" },
										status: { type: "string", enum: ["ATIVO", "INATIVO"] },
										createdAt: { type: "string" },
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
					description: "ID do aviso",
				},
			},
		},
		response: {
			200: {
				description: "Aviso encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							buildingId: { type: "string" },
							title: { type: "string" },
							content: { type: "string" },
							fileName: { type: "string" },
							fileSize: { type: "number" },
							url: { type: "string" },
							mimeType: { type: "string" },
							status: { type: "string", enum: ["ATIVO", "INATIVO"] },
							createdAt: { type: "string" },
						},
					},
				},
			},
			404: {
				description: "Aviso não encontrado",
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
					description: "ID do aviso",
				},
			},
		},
		body: {
			type: "object",
			required: ["deletedNote"],
			properties: {
				deletedNote: {
					type: "string",
					description: "Motivo da deleção do aviso",
					minLength: 3,
					maxLength: 500,
					example: "Aviso não é mais relevante",
				},
			},
		},
		response: {
			200: {
				description: "Aviso deletado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: { type: "null" },
				},
			},
			404: {
				description: "Aviso não encontrado",
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

