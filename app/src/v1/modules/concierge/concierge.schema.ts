export class ConciergeSchema {
	public create = {
		body: {
			type: "object",
			required: ["buildingId", "email", "password", "phone"],
			properties: {
				buildingId: {
					type: "string",
					description: "ID do edifício (UUID)",
					example: "123e4567-e89b-12d3-a456-426614174000",
				},
				name: {
					type: "string",
					description: "Nome do porteiro",
					example: "João Silva",
				},
				email: {
					type: "string",
					description: "Email do porteiro",
					example: "porteiro@example.com",
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
				shift: {
					type: "string",
					enum: ["MANHA", "TARDE", "NOITE"],
					description: "Turno do porteiro",
					example: "MANHA",
				},
				status: {
					type: "string",
					enum: ["INATIVO", "VALIDADO", "ATIVO", "DE_FERIAS"],
					description: "Status do porteiro (INATIVO, VALIDADO, ATIVO, DE_FERIAS). Se não informado, será ATIVO por padrão.",
					example: "ATIVO",
				},
			},
		},
		response: {
			201: {
				description: "Porteiro criado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							email: { type: "string" },
							phone: { type: "string" },
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
					description: "ID do porteiro",
				},
			},
		},
		response: {
			200: {
				description: "Porteiro encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							name: { type: "string" },
							email: { type: "string" },
							phone: { type: "string" },
							shift: { type: "string" },
							status: { type: "string" },
							createdAt: { type: "string" },
							updatedAt: { type: "string" },
						},
					},
				},
			},
			404: {
				description: "Porteiro não encontrado",
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
					description: "ID do porteiro",
				},
			},
		},
		body: {
			type: "object",
			properties: {
				buildingId: {
					type: "string",
					description: "ID do edifício (UUID)",
					example: "123e4567-e89b-12d3-a456-426614174000",
				},
				name: {
					type: "string",
					description: "Nome do porteiro",
					example: "João Silva",
				},
				email: {
					type: "string",
					description: "Email do porteiro",
					example: "joaosilva@example.com",
				},
				phone: {
					type: "string",
					description: "Telefone no formato internacional",
					example: "+5513974080222",
				},
				shift: {
					type: "string",
					enum: ["MANHA", "TARDE", "NOITE"],
					description: "Turno do porteiro",
					example: "MANHA",
				},
				status: {
					type: "string",
					enum: ["INATIVO", "VALIDADO", "ATIVO", "DE_FERIAS"],
					description: "Status do porteiro (INATIVO, VALIDADO, ATIVO, DE_FERIAS)",
					example: "ATIVO",
				},
			},
		},
		response: {
			200: {
				description: "Porteiro atualizado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							id: { type: "string" },
							name: { type: "string" },
							email: { type: "string" },
							phone: { type: "string" },
							shift: { type: "string" },
							status: { type: "string" },
							createdAt: { type: "string", format: "date-time" },
							updatedAt: { type: "string", format: "date-time" },
						},
					},
				},
			},
			404: {
				description: "Porteiro não encontrado",
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
					description: "ID do porteiro",
				},
			},
		},
		response: {
			200: {
				description: "Porteiro deletado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			404: {
				description: "Porteiro não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public getMany = {
		response: {
			200: {
				description: "Lista de porteiros encontrados",
				type: "object",
				properties: {
					success: { type: "boolean" },
					data: {
						type: "array",
						items: {
							type: "object",
							properties: {
								_id: { type: "string" },
								name: { type: "string" },
								email: { type: "string" },
								phone: { type: "string" },
								shift: { type: "string" },
								status: { type: "string" },
								createdAt: { type: "string" },
								updatedAt: { type: "string" },
							},
						},
					},
				},
			},
			404: {
				description: "Nenhum porteiro encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public forgetPassword = {
		body: {
			type: "object",
			required: ["email"],
			properties: {
				email: {
					type: "string",
					description: "Email do porteiro",
					example: "porteiro@example.com",
				},
			},
		},
		response: {
			200: {
				description: "Código de recuperação enviado para o email",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: { type: "null" },
				},
			},
			404: {
				description: "Email não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public resetPassword = {
		body: {
			type: "object",
			required: ["email", "code", "newPassword"],
			properties: {
				email: {
					type: "string",
					description: "Email do porteiro",
					example: "porteiro@example.com",
				},
				code: {
					type: "string",
					description: "Código de recuperação de 6 dígitos recebido por email",
					example: "123456",
				},
				newPassword: {
					type: "string",
					description:
						"Nova senha (mínimo 8 caracteres, com maiúscula, minúscula e caractere especial)",
					example: "NovaSenha@123",
				},
			},
		},
		response: {
			200: {
				description: "Senha redefinida com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: { type: "null" },
				},
			},
			400: {
				description: "Código inválido ou expirado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			404: {
				description: "Email não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};
}
