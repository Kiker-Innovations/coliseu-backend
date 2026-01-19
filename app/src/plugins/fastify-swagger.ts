import fastifySwagger from "@fastify/swagger";
import swaggerScalar from "@scalar/fastify-api-reference";

/**
 * Declarações globais para constantes injetadas pelo esbuild durante o build.
 * Esses valores são substituídos em tempo de build pelo esbuild.
 */
declare const __BUILD_PACKAGE_NAME__: string;
declare const __BUILD_PACKAGE_VERSION__: string;

/**
 * Informações da aplicação.
 * No build do Lambda, estes valores são substituídos diretamente pelo esbuild.
 * Em desenvolvimento, usa valores default.
 */
const application = {
  name:
    typeof __BUILD_PACKAGE_NAME__ !== "undefined"
      ? __BUILD_PACKAGE_NAME__
      : "coliseu",
  version:
    typeof __BUILD_PACKAGE_VERSION__ !== "undefined"
      ? __BUILD_PACKAGE_VERSION__
      : "2.0.0",
  description:
    "Generic software architecture framework in Node.js using Fastify, designed to provide a flexible and reusable foundation for application development.",
  author: "Luiz Ricardo Santos",
  email: "luizr726@gmail.com",
  license: "GPL-3.0",
};

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
