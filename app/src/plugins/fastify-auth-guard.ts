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
	const publicRoutes = [
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

		// Rotas de recuperação de senha
		`${config.stripPrefix}/v1/residents/forget-password`,
		`${config.stripPrefix}/v1/residents/reset-password`,
		`${config.stripPrefix}/v1/admins/forget-password`,
		`${config.stripPrefix}/v1/admins/reset-password`,
		`${config.stripPrefix}/v1/concierges/forget-password`,
		`${config.stripPrefix}/v1/concierges/reset-password`,
	];

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
			const routeUrl = request.url.split("?")[0]; // Remove query params
			
			// Verifica se a rota corresponde a algum padrão público (regex)
			const matchesPattern = publicRoutePatterns.some((pattern) =>
				pattern.test(routeUrl),
			);

			if (matchesPattern) {
				return; // Rota pública por padrão
			}

			// Verifica se é uma rota pública exata
			const isPublicRoute = publicRoutes.some((publicRoute) => {
				// Verifica se é uma rota pública
				if (routeUrl === publicRoute) {
					// Para rotas de cadastro, só libera POST
					if (
						publicRoute.endsWith("/residents") ||
						publicRoute.endsWith("/admins") ||
						publicRoute.endsWith("/concierges")
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

