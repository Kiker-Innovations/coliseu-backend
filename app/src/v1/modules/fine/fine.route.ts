import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { FineController } from "./fine.controller";
import { FineSchema } from "./fine.schema";
import { AuthMiddleware } from "../auth/auth.middleware";

const MODULE_TAG = "fine";

export class FineRouteV1 {
	private fineController: FineController;
	private fineSchema: FineSchema;
	private authMiddleware: AuthMiddleware;

	constructor(mongoClient: MongoClient) {
		this.fineController = new FineController(mongoClient);
		this.fineSchema = new FineSchema();
		this.authMiddleware = new AuthMiddleware(mongoClient);
	}

	private create = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/fines",
			schema: {
				tags: ["Fines"],
				summary: "Create a new fine",
				description: "Cria uma nova multa no sistema (apenas admin)",
				...this.fineSchema.create,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "create"),
			],
			handler: this.fineController.createFine.bind(
				this.fineController,
			) as RouteHandlerMethod,
		};
	};

	private getAll = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/fines",
			schema: {
				tags: ["Fines"],
				summary: "Get all fines",
				description: "Lista todas as multas (apenas admin e resident)",
				...this.fineSchema.getAll,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.fineController.getFines.bind(
				this.fineController,
			) as RouteHandlerMethod,
		};
	};

	private update = (): RouteOptions => {
		return {
			method: "PUT",
			url: "/v1/fines/:id",
			schema: {
				tags: ["Fines"],
				summary: "Update fine",
				description: "Atualiza uma multa no sistema (apenas admin)",
				...this.fineSchema.update,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "update"),
			],
			handler: this.fineController.updateFine.bind(
				this.fineController,
			) as RouteHandlerMethod,
		};
	};

	private remove = (): RouteOptions => {
		return {
			method: "DELETE",
			url: "/v1/fines/:id",
			schema: {
				tags: ["Fines"],
				summary: "Delete fine",
				description: "Remove uma multa do sistema (apenas admin)",
				...this.fineSchema.remove,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "delete"),
			],
			handler: this.fineController.deleteFine.bind(
				this.fineController,
			) as RouteHandlerMethod,
		};
	};

	public routes = (): RouteOptions[] => {
		return [this.create(), this.getAll(), this.update(), this.remove()];
	};
}
