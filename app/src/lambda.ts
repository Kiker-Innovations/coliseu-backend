import awsLambdaFastify from "@fastify/aws-lambda";
import type {
	APIGatewayProxyEvent,
	APIGatewayProxyEventV2,
	APIGatewayProxyResult,
	APIGatewayProxyResultV2,
	Context,
} from "aws-lambda";
import { injectSecretsToEnv } from "./providers/aws/secrets-manager.provider";

/**
 * Proxy handler criado pelo @fastify/aws-lambda.
 * Armazenado em escopo de módulo para reutilização entre invocações (warm starts).
 */
let proxy: ReturnType<typeof awsLambdaFastify> | null = null;

/**
 * Flag para indicar se os secrets já foram carregados.
 */
let secretsLoaded = false;

/**
 * Inicializa o proxy do Lambda de forma lazy.
 * Isso permite que a primeira invocação configure a aplicação,
 * e as invocações subsequentes reutilizem a mesma instância.
 */
async function initializeProxy(): Promise<ReturnType<typeof awsLambdaFastify>> {
	if (!proxy) {
		// Carrega os secrets do AWS Secrets Manager ANTES de importar a aplicação
		// Isso é necessário porque env.ts valida as variáveis de ambiente no momento do import
		if (!secretsLoaded) {
			console.log("[Lambda] Carregando secrets do AWS Secrets Manager...");
			await injectSecretsToEnv();
			secretsLoaded = true;
		}

		// Import dinâmico para garantir que os secrets já estão nas env vars
		console.log("[Lambda] Inicializando aplicação Fastify...");
		const { buildApp } = await import("./app");
		const app = await buildApp({ logger: true });

		proxy = awsLambdaFastify(app, {
			// decorateRequest: false because buildApp() calls server.ready()
			// which locks the plugin chain before awsLambdaFastify runs
			decorateRequest: false,
		});
		console.log("[Lambda] Proxy @fastify/aws-lambda criado com sucesso");
	}
	return proxy;
}

/**
 * Handler principal para AWS Lambda.
 * Compatível com API Gateway REST API (v1) e HTTP API (v2).
 *
 * @example
 * // Configuração no AWS Lambda
 * Handler: dist/src/lambda.handler
 *
 * @example
 * // Configuração no serverless.yml
 * functions:
 *   api:
 *     handler: dist/src/lambda.handler
 *     events:
 *       - httpApi: '*'
 */
export async function handler(
	event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
	context: Context,
): Promise<APIGatewayProxyResult | APIGatewayProxyResultV2> {
	// Evita que o Lambda aguarde o event loop esvaziar
	// Importante para conexões persistentes como MongoDB
	context.callbackWaitsForEmptyEventLoop = false;

	console.log(
		"[Lambda] Event recebido:",
		JSON.stringify(
			{
				httpMethod: (event as APIGatewayProxyEvent).httpMethod,
				requestContext: {
					http: (event as APIGatewayProxyEventV2).requestContext?.http,
					resourcePath: (event as APIGatewayProxyEvent).requestContext
						?.resourcePath,
				},
				path: (event as APIGatewayProxyEvent).path,
				rawPath: (event as APIGatewayProxyEventV2).rawPath,
				headers: event.headers,
			},
			null,
			2,
		),
	);

	const proxyHandler = await initializeProxy();

	// Usa callback pattern que é o esperado pelo @fastify/aws-lambda
	const result = await new Promise<
		APIGatewayProxyResult | APIGatewayProxyResultV2
	>((resolve, reject) => {
		proxyHandler(event, context, (err, res) => {
			if (err) {
				console.error("[Lambda] Erro no proxy:", err);
				reject(err);
			} else {
				const response = res as APIGatewayProxyResult;
				console.log(
					"[Lambda] Response do proxy:",
					JSON.stringify(
						{
							statusCode: response?.statusCode,
							headers: response?.headers,
							bodyLength: response?.body?.length,
							bodyPreview: response?.body?.substring(0, 500),
							isBase64Encoded: response?.isBase64Encoded,
						},
						null,
						2,
					),
				);
				resolve(response);
			}
		});
	});

	return result;
}

/**
 * Handler alternativo para uso com AWS Lambda Function URLs.
 * Mesma implementação, exportado com nome diferente para clareza.
 */
export const lambdaHandler = handler;
