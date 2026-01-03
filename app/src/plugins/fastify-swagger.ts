import fastifySwagger from "@fastify/swagger";
import swaggerScalar from "@scalar/fastify-api-reference";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, "../../package.json");
const application = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

// biome-ignore lint/suspicious/noExplicitAny: config type from plugin registration
export const swagger = async (fastify, config: any) => {
	await fastify.register(fastifySwagger, {
		swagger: {
			info: {
				title: application.name,
				version: application.version,
				description: application.description,
				contact: {
					name: application.author,
					email: application.email,
				},
				license: {
					name: application.license,
				},
			},
			schemes: ["http"],
			consumes: ["application/json"],
			produces: ["application/json"],
			securityDefinitions: {
				BearerAuth: {
					type: "apiKey",
					name: "Authorization",
					in: "header",
					description: "Token de autenticação no formato: Bearer {token}",
				},
			},
			externalDocs: {
				url: "https://swagger.io",
				description: "Find more info here",
			},
		},
	});

	await fastify.register(swaggerScalar, {
		routePrefix: `${config.stripPrefix.path}/docs`,
		configuration: {
			theme: "bluePlanet",
			layout: "classic",
			darkMode: true,
		},
	});
};
