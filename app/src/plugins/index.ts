import type { FastifyInstance } from "fastify";
import { env } from "../config/env";
import { cors } from "./fastify-cors";
import { healthcheck } from "./fastify-healthcheck";
import { schemaCompiler } from "./fastify-schema-compiler";
import { swagger } from "./fastify-swagger";

const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const isPrd = env.app.environment?.toUpperCase() === "PRD";

const plugins =
	isLambda || isPrd
		? [cors, healthcheck, schemaCompiler]
		: [swagger, cors, healthcheck, schemaCompiler];

export const registerPlugins = (server: FastifyInstance, config: any) => {
	for (const plugin of plugins) {
		plugin(server, config);
	}
};
