import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { MongoClient } from "mongodb";
import { AuthMiddleware } from "../v1/modules/auth/auth.middleware";

interface AuthGuardConfig {
	mongoClient: MongoClient;
	stripPrefix: string;
}

export const authGuard = async (
	fastify: FastifyInstance,
	config: AuthGuardConfig,
) => {
	const authMiddleware = new AuthMiddleware(config.mongoClient);

	// Lista de rotas públicas (sem necessidade de autenticação)
	// Armazena tanto com prefixo quanto sem prefixo para garantir compatibilidade
	const publicRoutesWithPrefix = [
		// Health check
		`${config.stripPrefix}/healthcheck`,

		// Rotas de autenticação
		`${config.stripPrefix}/v1/auth/login/resident`,
		`${config.stripPrefix}/v1/auth/login/concierge`,
		`${config.stripPrefix}/v1/auth/login/admin`,
		`${config.stripPrefix}/v1/auth/refresh`,

		// Rotas de cadastro (POST apenas)
		`${config.stripPrefix}/v1/residents`,
		`${config.stripPrefix}/v1/admins`,
		`${config.stripPrefix}/v1/concierges`,

		// Rotas de confirmação de email
		`${config.stripPrefix}/v1/residents/confirm`,
		`${config.stripPrefix}/v1/admins/confirm`,
		`${config.stripPrefix}/v1/concierges/confirm`,

		// Rotas de recuperação de senha
		`${config.stripPrefix}/v1/residents/forget-password`,
		`${config.stripPrefix}/v1/residents/reset-password`,
		`${config.stripPrefix}/v1/admins/forget-password`,
		`${config.stripPrefix}/v1/admins/reset-password`,
		`${config.stripPrefix}/v1/concierges/forget-password`,
		`${config.stripPrefix}/v1/concierges/reset-password`,
	];

	// Rotas públicas sem prefixo (para compatibilidade)
	const publicRoutesWithoutPrefix = publicRoutesWithPrefix.map((route) =>
		route.replace(config.stripPrefix, ""),
	);

	// Combina ambas as listas
	const publicRoutes = [...publicRoutesWithPrefix, ...publicRoutesWithoutPrefix];

	// Padrões de rotas públicas (regex)
	const publicRoutePatterns = [
		// Swagger documentation
		new RegExp(`^${config.stripPrefix}/docs.*`),
		new RegExp(`^${config.stripPrefix}/swagger.*`),
	];

	// Hook que será executado antes de cada rota
	fastify.addHook(
		"onRequest",
		async (request: FastifyRequest, reply: FastifyReply) => {
			// Tenta usar routerPath primeiro (mais confiável), senão usa url
			const routeUrl = (request as any).routerPath || request.url.split("?")[0];
			
			// Verifica se a rota corresponde a algum padrão público (regex)
			const matchesPattern = publicRoutePatterns.some((pattern) =>
				pattern.test(routeUrl),
			);

			if (matchesPattern) {
				return; // Rota pública por padrão
			}

			// Normaliza a rota para comparação (remove trailing slash e query params)
			const normalizedRouteUrl = routeUrl.replace(/\/$/, "");

			// Verifica se é uma rota pública exata (com ou sem prefixo)
			const isPublicRoute = publicRoutes.some((publicRoute) => {
				const normalizedPublicRoute = publicRoute.replace(/\/$/, "");
				// Verifica se é uma rota pública
				if (normalizedRouteUrl === normalizedPublicRoute) {
					// Para rotas de cadastro, só libera POST
					if (
						normalizedPublicRoute.endsWith("/residents") ||
						normalizedPublicRoute.endsWith("/admins") ||
						normalizedPublicRoute.endsWith("/concierges")
					) {
						return request.method === "POST";
					}
					return true;
				}
				return false;
			});

			// Se não for rota pública, aplica autenticação
			if (!isPublicRoute) {
				await authMiddleware.authenticate(request, reply);
			}
		},
	);
};

