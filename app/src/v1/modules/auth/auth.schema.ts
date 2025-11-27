import {
	protectedSchema,
	unauthorizedResponse,
} from "../../utils/schemaHelper";

export class AuthSchema {
	public loginResident = {
		body: {
			type: "object",
			required: ["buildingId", "email", "password"],
			properties: {
				buildingId: {
					type: "string",
					description: "ID do edifício (UUID)",
					example: "123e4567-e89b-12d3-a456-426614174000",
				},
				email: {
					type: "string",
					description: "Email do morador",
					example: "morador@example.com",
				},
				password: {
					type: "string",
					description: "Senha do morador",
					example: "Senha@123",
				},
			},
		},
		response: {
			200: {
				description: "Login realizado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							token: { type: "string", description: "JWT access token" },
							refreshToken: {
								type: "string",
								description: "JWT refresh token",
							},
						},
					},
				},
			},
			401: {
				description: "Credenciais inválidas",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			403: {
				description: "Cadastro não confirmado ou não aprovado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public loginConcierge = {
		body: {
			type: "object",
			required: ["buildingId", "email", "password"],
			properties: {
				buildingId: {
					type: "string",
					description: "ID do edifício (UUID)",
					example: "123e4567-e89b-12d3-a456-426614174000",
				},
				email: {
					type: "string",
					description: "Email do porteiro",
					example: "porteiro@example.com",
				},
				password: {
					type: "string",
					description: "Senha do porteiro",
					example: "Senha@123",
				},
			},
		},
		response: {
			200: {
				description: "Login realizado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							token: { type: "string", description: "JWT access token" },
							refreshToken: {
								type: "string",
								description: "JWT refresh token",
							},
						},
					},
				},
			},
			401: {
				description: "Credenciais inválidas",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			403: {
				description: "Usuário inativo",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public loginAdmin = {
		body: {
			type: "object",
			required: ["buildingId", "email", "password"],
			properties: {
				buildingId: {
					type: "string",
					description: "ID do edifício (UUID)",
					example: "123e4567-e89b-12d3-a456-426614174000",
				},
				email: {
					type: "string",
					description: "Email do administrador",
					example: "admin@example.com",
				},
				password: {
					type: "string",
					description: "Senha do administrador",
					example: "Senha@123",
				},
			},
		},
		response: {
			200: {
				description: "Login realizado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							token: { type: "string", description: "JWT access token" },
							refreshToken: {
								type: "string",
								description: "JWT refresh token",
							},
						},
					},
				},
			},
			401: {
				description: "Credenciais inválidas",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			403: {
				description: "Usuário inativo",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public validateResident = protectedSchema({
		response: {
			200: {
				description: "Token válido",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							id: { type: "string", description: "ID do morador" },
							email: { type: "string" },
							name: { type: "string" },
							apartmentNumber: { type: "string" },
							blockName: { type: "string" },
							buildingName: { type: "string" },
						},
					},
				},
			},
			403: {
				description: "Usuário não está ativo",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			...unauthorizedResponse,
		},
	});

	public validateConcierge = protectedSchema({
		response: {
			200: {
				description: "Token válido",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							email: { type: "string" },
							name: { type: "string" },
							shift: { type: "string" },
							buildingName: { type: "string" },
						},
					},
				},
			},
			...unauthorizedResponse,
		},
	});

	public validateAdmin = protectedSchema({
		response: {
			200: {
				description: "Token válido",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							email: { type: "string" },
							name: { type: "string" },
							buildingName: { type: "string" },
						},
					},
				},
			},
			...unauthorizedResponse,
		},
	});

	public refreshToken = {
		body: {
			type: "object",
			required: ["refreshToken"],
			properties: {
				refreshToken: {
					type: "string",
					description: "Refresh token recebido no login",
					example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
				},
			},
		},
		response: {
			200: {
				description: "Token renovado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							token: { type: "string", description: "Novo JWT access token" },
							refreshToken: {
								type: "string",
								description: "Novo JWT refresh token",
							},
						},
					},
				},
			},
			401: {
				description: "Refresh token inválido ou expirado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};
}

