export class ResidentSchema {
	public create = {
		body: {
			type: "object",
			required: ["name", "apartmentNumber", "email", "password", "phone"],
			properties: {
				name: {
					type: "string",
					description: "Nome completo do morador",
					example: "João Silva",
				},
				apartmentNumber: {
					type: "string",
					description: "Número do apartamento (máximo 4 dígitos numéricos)",
					example: "1234",
				},
				email: {
					type: "string",
					description: "Email do morador",
					example: "morador@example.com",
				},
				password: {
					type: "string",
					description:
						"Senha (mínimo 8 caracteres, com maiúscula, minúscula e caractere especial)",
					example: "Senha@123",
				},
				phone: {
					type: "string",
					description: "Telefone no formato internacional",
					example: "+5513974080222",
				},
			},
		},
		response: {
			201: {
				description: "Morador criado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							name: { type: "string" },
							email: { type: "string" },
							apartmentNumber: { type: "string" },
							phone: { type: "string" },
							presignedUrl: { type: "string" },
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
				description: "Email já cadastrado",
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
					description: "ID do morador",
				},
			},
		},
		response: {
			200: {
				description: "Morador encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					data: {
						type: "object",
						properties: {
							apartmentNumber: { type: "string" },
							email: { type: "string" },
							phone: { type: "string" },
							photoUrl: { type: "string", nullable: true },
							createdAt: { type: "string" },
							updatedAt: { type: "string" },
						},
					},
				},
			},
			404: {
				description: "Morador não encontrado",
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
					description: "ID do morador",
				},
			},
		},
		body: {
			type: "object",
			properties: {
				name: {
					type: "string",
					description: "Nome completo do morador",
					example: "João Silva",
				},
				phone: {
					type: "string",
					description: "Telefone no formato internacional",
					example: "+5513974080222",
				},
				photoUrl: {
					type: "string",
					description: "URL da foto do morador",
					example:
						"https://bucket.s3.amazonaws.com/residents/abc-123/photo.jpg",
				},
			},
		},
		response: {
			200: {
				description: "Morador atualizado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							id: { type: "string" },
							apartmentNumber: { type: "string" },
							email: { type: "string" },
							phone: { type: "string" },
							status: { type: "string" },
							photoUrl: { type: "string", nullable: true },
							createdAt: { type: "string" },
							updatedAt: { type: "string" },
						},
					},
				},
			},
			404: {
				description: "Morador não encontrado",
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
					description: "ID do morador",
				},
			},
		},
		response: {
			200: {
				description: "Morador deletado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			404: {
				description: "Morador não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public confirm = {
		body: {
			type: "object",
			required: ["email", "code"],
			properties: {
				email: {
					type: "string",
					description: "Email do morador",
					example: "morador@example.com",
				},
				code: {
					type: "string",
					description: "Código de confirmação recebido por email",
					example: "ABC123",
				},
			},
		},
		response: {
			200: {
				description: "Código confirmado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			400: {
				description: "Código inválido ou morador não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public generatePresignedUrl = {
		params: {
			type: "object",
			required: ["id"],
			properties: {
				id: {
					type: "string",
					description: "ID do morador",
				},
			},
		},
		body: {
			type: "object",
			properties: {
				fileExtension: {
					type: "string",
					description: "Extensão do arquivo (jpg, png, etc)",
					example: "jpg",
					default: "jpg",
				},
			},
		},
		response: {
			200: {
				description: "URL pré-assinada gerada com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					data: {
						type: "object",
						properties: {
							presignedUrl: {
								type: "string",
								description: "URL para upload via PUT",
							},
							photoUrl: {
								type: "string",
								description: "URL pública da foto após upload",
							},
							s3Key: { type: "string", description: "Chave do objeto no S3" },
							instructions: { type: "string" },
							expiresIn: { type: "string", description: "Tempo de expiração" },
						},
					},
				},
			},
			404: {
				description: "Morador não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};
}
