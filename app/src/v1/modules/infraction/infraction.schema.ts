import {
	protectedSchema,
	unauthorizedResponse,
	forbiddenResponse,
} from "../../utils/schemaHelper";
import { FineStatusEnumValues } from "../../enum/fineStatus.enum";

export class InfractionSchema {
	public createFine = protectedSchema({
		body: {
			type: "object",
			required: ["fineId", "apartmentId", "value", "occurrenceDate"],
			properties: {
				fineId: {
					type: "string",
					description: "ID da multa",
					example: "123e4567-e89b-12d3-a456-426614174000",
				},
				apartmentId: {
					type: "string",
					description: "ID do apartamento",
					example: "123e4567-e89b-12d3-a456-426614174001",
				},
				value: {
					type: "number",
					description: "Valor da multa em reais",
					example: 150.0,
				},
				occurrenceDate: {
					type: "string",
					format: "date-time",
					description: "Data da ocorrência (ISO 8601)",
					example: "2024-01-15T10:30:00Z",
				},
			},
		},
		response: {
			201: {
				description: "Multa aplicada com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							apartmentId: { type: "string" },
							fineId: { type: "string" },
							type: { type: "string", enum: ["MULTA"] },
							value: { type: "number" },
							occurrenceDate: { type: "string", format: "date-time" },
							status: { type: "string", enum: FineStatusEnumValues },
							createdAt: { type: "string", format: "date-time" },
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

	public createNotification = protectedSchema({
		body: {
			type: "object",
			required: ["fineId", "apartmentId", "description", "occurrenceDate"],
			properties: {
				fineId: {
					type: "string",
					description: "ID da multa/notificação",
					example: "123e4567-e89b-12d3-a456-426614174000",
				},
				apartmentId: {
					type: "string",
					description: "ID do apartamento",
					example: "123e4567-e89b-12d3-a456-426614174001",
				},
				description: {
					type: "string",
					description: "Descrição da notificação",
					example: "Notificação sobre barulho excessivo após as 22h",
				},
				occurrenceDate: {
					type: "string",
					format: "date-time",
					description: "Data da ocorrência (ISO 8601)",
					example: "2024-01-15T10:30:00Z",
				},
			},
		},
		response: {
			201: {
				description: "Notificação aplicada com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							apartmentId: { type: "string" },
							fineId: { type: "string" },
							type: { type: "string", enum: ["NOTIFICACAO"] },
							description: { type: "string" },
							occurrenceDate: { type: "string", format: "date-time" },
							status: { type: "string", enum: FineStatusEnumValues },
							createdAt: { type: "string", format: "date-time" },
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
				apartmentId: {
					type: "string",
					description: "Filtro por ID do apartamento",
				},
				status: {
					type: "string",
					enum: FineStatusEnumValues,
					description: "Filtro por status da infração",
				},
			},
		},
		response: {
			200: {
				description: "Apartamentos com infrações encontrados",
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
								residents: {
									type: "array",
									items: {
										type: "object",
										properties: {
											_id: { type: "string" },
											name: { type: "string" },
											email: { type: "string" },
											phone: { type: "string" },
										},
									},
								},
								infractions: {
									type: "array",
									items: {
										type: "object",
										properties: {
											_id: { type: "string" },
											apartmentId: { type: "string" },
											fineId: { type: "string" },
											type: { type: "string", enum: ["MULTA", "NOTIFICACAO"] },
											description: { type: "string" },
											value: { type: "number" },
											occurrenceDate: { type: "string", format: "date-time" },
											status: { type: "string", enum: FineStatusEnumValues },
											createdAt: { type: "string", format: "date-time" },
											updatedAt: { type: "string", format: "date-time" },
											contextedAt: { type: "string", format: "date-time" },
											confirmedAt: { type: "string", format: "date-time" },
											paidAt: { type: "string", format: "date-time" },
											canceledAt: { type: "string", format: "date-time" },
											canceledNote: { type: "string" },
										},
									},
								},
							},
						},
					},
				},
			},
			...unauthorizedResponse,
			...forbiddenResponse,
		},
	});

	public getMyFines = protectedSchema({
		querystring: {
			type: "object",
			properties: {
				status: {
					type: "string",
					enum: FineStatusEnumValues,
					description: "Filtro opcional por status da multa",
				},
			},
		},
		response: {
			200: {
				description: "Multas do morador encontradas",
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
								fineId: { type: "string" },
								type: { type: "string", enum: ["MULTA"] },
								description: { type: "string" },
								value: { type: "number" },
								occurrenceDate: { type: "string", format: "date-time" },
								status: { type: "string", enum: FineStatusEnumValues },
								createdAt: { type: "string", format: "date-time" },
								updatedAt: { type: "string", format: "date-time" },
								contextedAt: { type: "string", format: "date-time" },
								confirmedAt: { type: "string", format: "date-time" },
								paidAt: { type: "string", format: "date-time" },
								canceledAt: { type: "string", format: "date-time" },
								canceledNote: { type: "string" },
								fineName: { type: "string" },
								fineDescription: { type: "string" },
							},
						},
					},
				},
			},
			400: {
				description: "Erro na requisição",
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

	public contestInfraction = protectedSchema({
		body: {
			type: "object",
			required: ["infractionId", "text", "fileName", "fileSize", "mimeType"],
			properties: {
				infractionId: {
					type: "string",
					format: "uuid",
					description: "ID da infração a ser contestada",
					example: "123e4567-e89b-12d3-a456-426614174000",
				},
				text: {
					type: "string",
					description: "Texto da contestação",
					example: "Gostaria de contestar esta multa pois...",
				},
				fileName: {
					type: "string",
					description: "Nome do arquivo de evidência",
					example: "evidencia.pdf",
				},
				fileSize: {
					type: "number",
					description: "Tamanho do arquivo em bytes",
					example: 1024000,
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
				description: "Contestação criada com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							infractionId: { type: "string" },
							presignedUrl: { type: "string" },
							createdAt: { type: "string", format: "date-time" },
						},
					},
				},
			},
			400: {
				description: "Dados inválidos ou infração já contestada",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			403: {
				description: "Permissão negada",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			404: {
				description: "Infração não encontrada",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			...unauthorizedResponse,
		},
	});

	public getInfractionAppeal = protectedSchema({
		params: {
			type: "object",
			required: ["infractionId"],
			properties: {
				infractionId: {
					type: "string",
					format: "uuid",
					description: "ID da infração",
					example: "123e4567-e89b-12d3-a456-426614174000",
				},
			},
		},
		response: {
			200: {
				description: "Contestação encontrada com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							infractionId: { type: "string" },
							text: { type: "string" },
							fileName: { type: "string" },
							fileSize: { type: "number" },
							url: { type: "string" },
							createdAt: { type: "string", format: "date-time" },
						},
					},
				},
			},
			403: {
				description: "Permissão negada",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			404: {
				description: "Contestação não encontrada",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			...unauthorizedResponse,
		},
	});

	public approveAppeal = protectedSchema({
		params: {
			type: "object",
			required: ["infractionId"],
			properties: {
				infractionId: {
					type: "string",
					format: "uuid",
					description: "ID da infração",
					example: "123e4567-e89b-12d3-a456-426614174000",
				},
			},
		},
		body: {
			type: "object",
			properties: {},
		},
		response: {
			200: {
				description: "Contestação aprovada com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							status: { type: "string" },
							canceledAt: { type: "string", format: "date-time" },
						},
					},
				},
			},
			400: {
				description: "A infração não está em revisão",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			404: {
				description: "Infração não encontrada",
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

	public rejectAppeal = protectedSchema({
		params: {
			type: "object",
			required: ["infractionId"],
			properties: {
				infractionId: {
					type: "string",
					format: "uuid",
					description: "ID da infração",
					example: "123e4567-e89b-12d3-a456-426614174000",
				},
			},
		},
		body: {
			type: "object",
			properties: {},
		},
		response: {
			200: {
				description: "Contestação reprovada com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							status: { type: "string" },
							confirmedAt: { type: "string", format: "date-time" },
						},
					},
				},
			},
			400: {
				description: "A infração não está em revisão",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			404: {
				description: "Infração não encontrada",
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

	public getInfractionAppealForAdmin = protectedSchema({
		params: {
			type: "object",
			required: ["infractionId"],
			properties: {
				infractionId: {
					type: "string",
					format: "uuid",
					description: "ID da infração",
					example: "123e4567-e89b-12d3-a456-426614174000",
				},
			},
		},
		response: {
			200: {
				description: "Contestação encontrada com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							infractionId: { type: "string" },
							text: { type: "string" },
							fileName: { type: "string" },
							fileSize: { type: "number" },
							url: { type: "string" },
							createdAt: { type: "string", format: "date-time" },
							residentId: { type: "string" },
						},
					},
				},
			},
			404: {
				description: "Contestação não encontrada",
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

	public cancelNotification = protectedSchema({
		params: {
			type: "object",
			required: ["infractionId"],
			properties: {
				infractionId: {
					type: "string",
					format: "uuid",
					description: "ID da infração (notificação)",
					example: "123e4567-e89b-12d3-a456-426614174000",
				},
			},
		},
		body: {
			type: "object",
			properties: {},
		},
		response: {
			200: {
				description: "Notificação excluída com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							deletedAt: { type: "string", format: "date-time" },
						},
					},
				},
			},
			400: {
				description: "Apenas notificações ativas podem ser canceladas",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			404: {
				description: "Infração não encontrada",
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
