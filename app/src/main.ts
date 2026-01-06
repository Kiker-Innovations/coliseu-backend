import { buildApp, shutdownApp } from "./app";
import { env } from "./config/env";

async function bootstrap(): Promise<void> {
	try {
		process.stdout.write("\x1Bc\n\x1b[32mStarting server...\x1b[0m\n");

		const server = await buildApp({ logger: true });

		await server.listen({ port: env.app.port || 3000, host: "::" });

		const signals = ["SIGINT", "SIGTERM"];
		for (const signal of signals) {
			process.on(signal, async () => {
				console.log(`\n${signal} received, closing server gracefully...`);
				await shutdownApp();
				process.exit(0);
			});
		}
	} catch (error) {
		console.error("Failed to start server:", error);
		await shutdownApp();
		process.exit(1);
	}
}

bootstrap();
