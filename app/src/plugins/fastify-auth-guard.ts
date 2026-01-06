import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { MongoClient } from "mongodb";
import fp from "fastify-plugin";
import { AuthMiddleware } from "../v1/modules/auth/auth.middleware";

interface AuthGuardConfig {
	mongoClient: MongoClient;
	stripPrefix: string;
}

const authGuardPlugin = async (
	fastify: FastifyInstance,
	config: AuthGuardConfig,
) => {
	const authMiddleware = new AuthMiddleware(config.mongoClient);

	const publicRoutesWithPrefix = [
		`${config.stripPrefix}/healthcheck`,

		`${config.stripPrefix}/v1/auth/login/resident`,
		`${config.stripPrefix}/v1/auth/login/concierge`,
		`${config.stripPrefix}/v1/auth/login/admin`,
		`${config.stripPrefix}/v1/auth/refresh`,

		`${config.stripPrefix}/v1/residents`,
		`${config.stripPrefix}/v1/admins`,
		`${config.stripPrefix}/v1/concierges`,

		`${config.stripPrefix}/v1/residents/confirm`,
		`${config.stripPrefix}/v1/admins/confirm`,
		`${config.stripPrefix}/v1/concierges/confirm`,

		`${config.stripPrefix}/v1/residents/forget-password`,
		`${config.stripPrefix}/v1/residents/reset-password`,
		`${config.stripPrefix}/v1/residents/status`,
		`${config.stripPrefix}/v1/residents/resend-confirmation-email`,
		`${config.stripPrefix}/v1/residents/update-rejected`,
		`${config.stripPrefix}/v1/admins/forget-password`,
		`${config.stripPrefix}/v1/admins/reset-password`,
		`${config.stripPrefix}/v1/concierges/forget-password`,
		`${config.stripPrefix}/v1/concierges/reset-password`,

		`${config.stripPrefix}/v1/buildings`,
		`${config.stripPrefix}/v1/apartments`,
	];

	const publicRoutesWithoutPrefix = publicRoutesWithPrefix.map((route) =>
		route.replace(config.stripPrefix, ""),
	);

	const publicRoutes = [
		...publicRoutesWithPrefix,
		...publicRoutesWithoutPrefix,
	];

	const publicRoutePatterns = [
		new RegExp(`^${config.stripPrefix}/docs.*`),
		new RegExp(`^${config.stripPrefix}/swagger.*`),
		new RegExp(`^${config.stripPrefix}/v1/buildings/.*/apartments$`),
	];

	fastify.addHook(
		"onRequest",
		async (request: FastifyRequest, reply: FastifyReply) => {
			const routeUrl = request.routeOptions.url || request.url.split("?")[0];

			const matchesPattern = publicRoutePatterns.some((pattern) =>
				pattern.test(routeUrl),
			);

			if (matchesPattern) {
				return;
			}

			const normalizedRouteUrl = routeUrl.replace(/\/$/, "");

			const isPublicRoute = publicRoutes.some((publicRoute) => {
				const normalizedPublicRoute = publicRoute.replace(/\/$/, "");
				if (normalizedRouteUrl === normalizedPublicRoute) {
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

			if (!isPublicRoute) {
				await authMiddleware.authenticate(request, reply);
			}
		},
	);
};

export const authGuard = fp(authGuardPlugin, {
	name: "auth-guard",
});
