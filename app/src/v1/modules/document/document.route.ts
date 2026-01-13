import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { DocumentController } from "./document.controller";
import { DocumentSchema } from "./document.schema";
import { AuthMiddleware } from "../auth/auth.middleware";

const MODULE_TAG = "document";

export class DocumentRouteV1 {
	private documentController: DocumentController;
	private documentSchema: DocumentSchema;
	private authMiddleware: AuthMiddleware;

	constructor(mongoClient: MongoClient) {
		this.documentController = new DocumentController(mongoClient);
		this.documentSchema = new DocumentSchema();
		this.authMiddleware = new AuthMiddleware(mongoClient);
	}

	private create = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/documents",
			schema: {
				tags: ["Documents"],
				summary: "Create a new document",
				description:
					"Cria um novo documento e notifica os moradores do edifício por email (apenas admin)",
				...this.documentSchema.create,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "create"),
			],
			handler: this.documentController.createDocument.bind(
				this.documentController,
			) as RouteHandlerMethod,
		};
	};

	private getAll = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/documents",
			schema: {
				tags: ["Documents"],
				summary: "Get all documents for the building",
				description:
					"Lista todos os documentos do edifício do usuário ordenados por data de criação",
				...this.documentSchema.getAll,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.documentController.getDocuments.bind(
				this.documentController,
			) as RouteHandlerMethod,
		};
	};

	private getById = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/documents/:id",
			schema: {
				tags: ["Documents"],
				summary: "Get document by ID",
				description: "Busca um documento específico por ID",
				...this.documentSchema.getById,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.documentController.getDocumentById.bind(
				this.documentController,
			) as RouteHandlerMethod,
		};
	};

	private update = (): RouteOptions => {
		return {
			method: "PUT",
			url: "/v1/documents/:id",
			schema: {
				tags: ["Documents"],
				summary: "Update document",
				description: "Atualiza nome e descrição de um documento (apenas admin)",
				...this.documentSchema.update,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "update"),
			],
			handler: this.documentController.updateDocument.bind(
				this.documentController,
			) as RouteHandlerMethod,
		};
	};

	private remove = (): RouteOptions => {
		return {
			method: "DELETE",
			url: "/v1/documents/:id",
			schema: {
				tags: ["Documents"],
				summary: "Delete document",
				description: "Remove um documento do sistema (apenas admin)",
				...this.documentSchema.remove,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "delete"),
			],
			handler: this.documentController.deleteDocument.bind(
				this.documentController,
			) as RouteHandlerMethod,
		};
	};

	public routes = (): RouteOptions[] => {
		return [
			this.create(),
			this.getAll(),
			this.getById(),
			this.update(),
			this.remove(),
		];
	};
}
