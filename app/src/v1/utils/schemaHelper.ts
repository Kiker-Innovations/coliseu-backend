/**
 * Helper para adicionar segurança Bearer Token aos schemas das rotas
 */
export const withBearerAuth = () => ({
	security: [{ BearerAuth: [] }],
	headers: {
		type: "object",
		properties: {
			authorization: {
				type: "string",
				description: "Bearer token de autenticação",
			},
		},
		required: ["authorization"],
	},
});

/**
 * Helper para mesclar o schema base com a autenticação Bearer
 */
export const protectedSchema = (schema: any) => ({
	...schema,
	...withBearerAuth(),
});

/**
 * Adiciona resposta 401 (não autenticado) ao schema
 */
export const unauthorizedResponse = {
	401: {
		description: "Token de autenticação inválido ou não fornecido",
		type: "object",
		properties: {
			success: { type: "boolean" },
			message: { type: "string" },
		},
	},
};

/**
 * Adiciona resposta 403 (não autorizado) ao schema
 */
export const forbiddenResponse = {
	403: {
		description: "Você não tem permissão para acessar este recurso",
		type: "object",
		properties: {
			success: { type: "boolean" },
			message: { type: "string" },
		},
	},
};

