import fastify, { type FastifyInstance } from "fastify";
import { Route } from "./app.module";
import { env } from "./config/env";
import { errorHandler } from "./config/error";
import { mongoConnection } from "./database/mongodb/mongoConnection";
import { registerPlugins } from "./plugins";

const server: FastifyInstance = fastify({
	logger: true,
});

async function bootstrap(): Promise<void> {
	try {
		process.stdout.write("\x1Bc\n\x1b[32mStarting server...\x1b[0m\n");

		await mongoConnection.connect();

		server.setErrorHandler((error, request, reply) =>
			errorHandler(error, request, reply),
		);

		registerPlugins(server, env);

		// Registra o guard de autenticação global
		const { authGuard } = await import("./plugins/fastify-auth-guard");
		await server.register(authGuard, {
			mongoClient: mongoConnection.getClient(),
			stripPrefix: env.stripPrefix.path,
		});

		server.register(new Route().registerRoutes, {
			prefix: env.stripPrefix.path,
		});
		await server.listen({ port: env.app.port || 3000, host: "::" });

		const signals = ["SIGINT", "SIGTERM"];
		for (const signal of signals) {
			process.on(signal, async () => {
				console.log(`\n${signal} received, closing server gracefully...`);
				await server.close();
				await mongoConnection.disconnect();
				process.exit(0);
			});
		}
	} catch (error) {
		server.log.error(error);
		await mongoConnection.disconnect();
		process.exit(1);
	}
}

bootstrap();
