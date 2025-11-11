export class AdminSchema {
	public create = {
		body: {
			type: "object",
			required: ["name", "email", "password"],
			properties: {
				name: {
					type: "string",
					description: "Nome completo do administrador",
					example: "João Silva",
				},
				email: {
					type: "string",
					description: "Email do administrador",
					example: "admin@example.com",
				},
				password: {
					type: "string",
					description:
						"Senha (mínimo 8 caracteres, com maiúscula, minúscula e caractere especial)",
					example: "Senha@123",
				},
			},
		},
		response: {
			201: {
				description: "Administrador criado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							name: { type: "string" },
							email: { type: "string" },
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
					description: "ID do administrador",
				},
			},
		},
		response: {
			200: {
				description: "Administrador encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							name: { type: "string" },
							email: { type: "string" },
							status: { type: "string", description: "Status do administrador (INATIVO, ATIVO)" },
						},
					},
				},
			},
			404: {
				description: "Administrador não encontrado",
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
					description: "ID do administrador",
				},
			},
		},
		body: {
			type: "object",
			properties: {
				name: {
					type: "string",
					description: "Nome completo do administrador",
					example: "João Silva",
				},
			},
		},
		response: {
			200: {
				description: "Administrador atualizado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							name: { type: "string" },
							email: { type: "string" },
							status: { type: "string", description: "Status do administrador (INATIVO, ATIVO)" },
						},
					},
				},
			},
			404: {
				description: "Administrador não encontrado",
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
					description: "ID do administrador",
				},
			},
		},
		response: {
			200: {
				description: "Administrador deletado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: { type: "null" },
				},
			},
			404: {
				description: "Administrador não encontrado",
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
					description: "Email do administrador",
					example: "admin@example.com",
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
					data: { type: "null" },
				},
			},
			400: {
				description: "Código inválido ou administrador não encontrado",
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
					description: "Email do administrador",
					example: "admin@example.com",
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
					description: "Email do administrador",
					example: "admin@example.com",
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

