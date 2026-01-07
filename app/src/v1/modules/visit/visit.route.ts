import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { VisitController } from "./visit.controller";
import { VisitSchema } from "./visit.schema";
import { AuthMiddleware } from "../auth/auth.middleware";

const MODULE_TAG = "visit";

export class VisitRouteV1 {
	private visitController: VisitController;
	private visitSchema: VisitSchema;
	private authMiddleware: AuthMiddleware;

	constructor(mongoClient: MongoClient) {
		this.visitController = new VisitController(mongoClient);
		this.visitSchema = new VisitSchema();
		this.authMiddleware = new AuthMiddleware(mongoClient);
		this.authMiddleware = new AuthMiddleware(mongoClient);
	}

	private create = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/visits",
			schema: {
				tags: ["Visits"],
				summary: "Create a new visit",
				description:
					"Registra uma nova visita de um visitante. O ID do porteiro e do edifício são obtidos automaticamente do token de autenticação.",
				...this.visitSchema.create,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "create"),
			],
			handler: this.visitController.createVisit.bind(
				this.visitController,
			) as RouteHandlerMethod,
		};
	};

	private listByVisitorId = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/visits/visitor/:visitorId",
			schema: {
				tags: ["Visits"],
				summary: "List visits by visitor ID",
				description:
					"Lista todas as visitas de um visitante específico com paginação",
				...this.visitSchema.listByVisitorId,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.visitController.listVisitsByVisitorId.bind(
				this.visitController,
			) as RouteHandlerMethod,
		};
	};

	private listRecent = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/visits/recent",
			schema: {
				tags: ["Visits"],
				summary: "List recent visits",
				description:
					"Lista as últimas visitas registradas do edifício do porteiro autenticado. Retorna dados do visitante e do apartamento vinculados. Usado no dashboard.",
				...this.visitSchema.listRecent,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.visitController.listRecentVisits.bind(
				this.visitController,
			) as RouteHandlerMethod,
		};
	};

	public routes = (): RouteOptions[] => {
		return [this.create(), this.listByVisitorId(), this.listRecent()];
	};
}
