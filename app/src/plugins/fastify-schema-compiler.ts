import Ajv from "ajv";
import addFormats from "ajv-formats";
import type { FastifyInstance } from "fastify";

const ajvInstance = new Ajv({
	removeAdditional: true,
	coerceTypes: false,
	allErrors: true,
});

const queryStringAjvInstance = new Ajv({
	removeAdditional: true,
	coerceTypes: true,
	allErrors: true,
});

addFormats(ajvInstance);
addFormats(queryStringAjvInstance);

ajvInstance.addKeyword({
	keyword: "stringIsNotEmpty",
	type: "string",
	validate: (_schema, data) => typeof data === "string" && data.trim() !== "",
});

queryStringAjvInstance.addKeyword({
	keyword: "stringIsNotEmpty",
	type: "string",
	validate: (_schema, data) => typeof data === "string" && data.trim() !== "",
});

const addKeywordIfNotExists = (ajv: Ajv, keyword: string) => {
	try {
		if (!ajv.RULES.keywords?.[keyword]) {
			ajv.addKeyword(keyword);
		}
	} catch {}
};

const documentationKeywords = ["example", "examples", "externalDocs"];
for (const keyword of documentationKeywords) {
	addKeywordIfNotExists(ajvInstance, keyword);
	addKeywordIfNotExists(queryStringAjvInstance, keyword);
}

const schemaCompilers = {
	body: ajvInstance,
	params: ajvInstance,
	querystring: queryStringAjvInstance,
	headers: ajvInstance,
};

export const schemaCompiler = (fastify: FastifyInstance) => {
	fastify.setValidatorCompiler((req) => {
		if (!req.httpPart) {
			throw new Error("Missing httpPart");
		}

		const compiler = schemaCompilers[req.httpPart];
		if (!compiler) {
			throw new Error(`Missing compiler for ${req.httpPart}`);
		}

		return compiler.compile(req.schema);
	});
};
