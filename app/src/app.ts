import fastify, { type FastifyInstance } from "fastify";
import { Route } from "./app.module";
import { env } from "./config/env";
import { errorHandler } from "./config/error";
import { mongoConnection } from "./database/mongodb/mongoConnection";
import { registerPlugins } from "./plugins";

let app: FastifyInstance | null = null;

export interface BuildAppOptions {
	logger?: boolean;
}

/**
 * Constrói e configura a instância do Fastify.
 * Essa função é reutilizada tanto pelo servidor tradicional quanto pelo Lambda.
 */
export async function buildApp(
	options: BuildAppOptions = {},
): Promise<FastifyInstance> {
	// Reutiliza a instância existente se já estiver configurada (útil para Lambda warm starts)
	if (app) {
		return app;
	}

	const server: FastifyInstance = fastify({
		logger: options.logger ?? true,
	});

	// Conecta ao MongoDB
	await mongoConnection.connect();

	// Configura o error handler global
	server.setErrorHandler((error, request, reply) =>
		errorHandler(error, request, reply),
	);

	// Registra os plugins (cors, healthcheck, swagger, etc.)
	registerPlugins(server, env);

	// Registra o guard de autenticação global
	// const { authGuard } = await import("./plugins/fastify-auth-guard");
	// await server.register(authGuard, {
	// 	mongoClient: mongoConnection.getClient(),
	// 	stripPrefix: env.stripPrefix.path,
	// });

	// Registra as rotas com o prefixo configurado
	server.register(new Route().registerRoutes, {
		prefix: env.stripPrefix.path,
	});

	// Aguarda todas as rotas e plugins serem registrados
	await server.ready();

	app = server;
	return server;
}

/**
 * Retorna a instância atual da aplicação (se existir).
 */
export function getApp(): FastifyInstance | null {
	return app;
}

/**
 * Reseta a instância da aplicação (útil para testes).
 */
export async function resetApp(): Promise<void> {
	if (app) {
		await app.close();
		app = null;
	}
}

/**
 * Encerra graciosamente a aplicação e desconecta do MongoDB.
 */
export async function shutdownApp(): Promise<void> {
	if (app) {
		await app.close();
		await mongoConnection.disconnect();
		app = null;
	}
}
