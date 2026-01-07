import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { VisitorController } from "./visitor.controller";
import { VisitorSchema } from "./visitor.schema";
import { AuthMiddleware } from "../auth/auth.middleware";

const MODULE_TAG = "visitor";

export class VisitorRouteV1 {
	private visitorController: VisitorController;
	private visitorSchema: VisitorSchema;
	private authMiddleware: AuthMiddleware;

	constructor(mongoClient: MongoClient) {
		this.visitorController = new VisitorController(mongoClient);
		this.visitorSchema = new VisitorSchema();
		this.authMiddleware = new AuthMiddleware(mongoClient);
	}

	private create = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/visitors",
			schema: {
				tags: ["Visitors"],
				summary: "Create a new visitor",
				description:
					"Cria um novo visitante no sistema. O ID do porteiro e do edifício são obtidos automaticamente do token de autenticação.",
				...this.visitorSchema.create,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "create"),
			],
			handler: this.visitorController.createVisitor.bind(
				this.visitorController,
			) as RouteHandlerMethod,
		};
	};

	private list = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/visitors",
			schema: {
				tags: ["Visitors"],
				summary: "List visitors",
				description:
					"Lista visitantes com paginação e filtros do edifício do porteiro autenticado",
				...this.visitorSchema.list,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.visitorController.listVisitors.bind(
				this.visitorController,
			) as RouteHandlerMethod,
		};
	};

	private getById = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/visitors/:id",
			schema: {
				tags: ["Visitors"],
				summary: "Get visitor by ID",
				description:
					"Busca um visitante específico por ID do edifício do porteiro autenticado",
				...this.visitorSchema.getById,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.visitorController.getVisitorById.bind(
				this.visitorController,
			) as RouteHandlerMethod,
		};
	};

	private update = (): RouteOptions => {
		return {
			method: "PUT",
			url: "/v1/visitors/:id",
			schema: {
				tags: ["Visitors"],
				summary: "Update visitor",
				description:
					"Atualiza um visitante existente. O ID do porteiro é obtido automaticamente do token de autenticação para registrar quem fez a atualização.",
				...this.visitorSchema.update,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "update"),
			],
			handler: this.visitorController.updateVisitor.bind(
				this.visitorController,
			) as RouteHandlerMethod,
		};
	};

	private listRecent = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/visitors/recent",
			schema: {
				tags: ["Visitors"],
				summary: "List recent visitors",
				description:
					"Lista os últimos visitantes cadastrados do edifício do porteiro autenticado (sem paginação)",
				...this.visitorSchema.listRecent,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.visitorController.listRecentVisitors.bind(
				this.visitorController,
			) as RouteHandlerMethod,
		};
	};

	public routes = (): RouteOptions[] => {
		return [
			this.create(),
			this.list(),
			this.listRecent(),
			this.getById(),
			this.update(),
		];
	};
}
