import awsLambdaFastify from "@fastify/aws-lambda";
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
  APIGatewayProxyResultV2,
  Context,
} from "aws-lambda";
import { buildApp } from "./app";

/**
 * Proxy handler criado pelo @fastify/aws-lambda.
 * Armazenado em escopo de módulo para reutilização entre invocações (warm starts).
 */
let proxy: ReturnType<typeof awsLambdaFastify> | null = null;

/**
 * Inicializa o proxy do Lambda de forma lazy.
 * Isso permite que a primeira invocação configure a aplicação,
 * e as invocações subsequentes reutilizem a mesma instância.
 */
async function initializeProxy(): Promise<ReturnType<typeof awsLambdaFastify>> {
  if (!proxy) {
    const app = await buildApp({ logger: true });

    proxy = awsLambdaFastify(app, {
      // Configurações opcionais do adapter
      decorateRequest: true,
      serializeLambdaArguments: false,
      decorationPropertyName: "awsLambda",
    });
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
  context: Context
): Promise<APIGatewayProxyResult | APIGatewayProxyResultV2> {
  // Evita que o Lambda aguarde o event loop esvaziar
  // Importante para conexões persistentes como MongoDB
  context.callbackWaitsForEmptyEventLoop = false;

  const proxyHandler = await initializeProxy();

  return new Promise((resolve, reject) => {
    proxyHandler(event, context, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result as APIGatewayProxyResult | APIGatewayProxyResultV2);
      }
    });
  });
}

/**
 * Handler alternativo para uso com AWS Lambda Function URLs.
 * Mesma implementação, exportado com nome diferente para clareza.
 */
export const lambdaHandler = handler;
