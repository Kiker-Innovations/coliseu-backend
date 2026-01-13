import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { UsefulContactController } from "./usefulContact.controller";
import { UsefulContactSchema } from "./usefulContact.schema";
import { AuthMiddleware } from "../auth/auth.middleware";

const MODULE_TAG = "useful-contact";

export class UsefulContactRouteV1 {
	private usefulContactController: UsefulContactController;
	private usefulContactSchema: UsefulContactSchema;
	private authMiddleware: AuthMiddleware;

	constructor(mongoClient: MongoClient) {
		this.usefulContactController = new UsefulContactController(mongoClient);
		this.usefulContactSchema = new UsefulContactSchema();
		this.authMiddleware = new AuthMiddleware(mongoClient);
	}

	private create = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/useful-contacts",
			schema: {
				tags: ["UsefulContacts"],
				summary: "Create a new useful contact",
				description:
					"Cria um novo contato útil. O ID do edifício é obtido automaticamente do token de autenticação do administrador.",
				...this.usefulContactSchema.create,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "create"),
			],
			handler: this.usefulContactController.createUsefulContact.bind(
				this.usefulContactController,
			) as RouteHandlerMethod,
		};
	};

	private getAll = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/useful-contacts",
			schema: {
				tags: ["UsefulContacts"],
				summary: "Get all useful contacts",
				description:
					"Busca todos os contatos úteis do edifício. O ID do edifício é obtido automaticamente do token de autenticação.",
				...this.usefulContactSchema.getAll,
			},
			preHandler: [this.authMiddleware.authenticate],
			handler: this.usefulContactController.getUsefulContactsByBuilding.bind(
				this.usefulContactController,
			) as RouteHandlerMethod,
		};
	};

	private getById = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/useful-contacts/:id",
			schema: {
				tags: ["UsefulContacts"],
				summary: "Get useful contact by ID",
				description: "Busca um contato útil específico por ID",
				...this.usefulContactSchema.getById,
			},
			preHandler: [this.authMiddleware.authenticate],
			handler: this.usefulContactController.getUsefulContactById.bind(
				this.usefulContactController,
			) as RouteHandlerMethod,
		};
	};

	private update = (): RouteOptions => {
		return {
			method: "PUT",
			url: "/v1/useful-contacts/:id",
			schema: {
				tags: ["UsefulContacts"],
				summary: "Update useful contact",
				description: "Atualiza um contato útil existente",
				...this.usefulContactSchema.update,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "update"),
			],
			handler: this.usefulContactController.updateUsefulContact.bind(
				this.usefulContactController,
			) as RouteHandlerMethod,
		};
	};

	private delete = (): RouteOptions => {
		return {
			method: "DELETE",
			url: "/v1/useful-contacts/:id",
			schema: {
				tags: ["UsefulContacts"],
				summary: "Delete useful contact",
				description: "Exclui um contato útil permanentemente",
				...this.usefulContactSchema.delete,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "delete"),
			],
			handler: this.usefulContactController.deleteUsefulContact.bind(
				this.usefulContactController,
			) as RouteHandlerMethod,
		};
	};

	public routes = (): RouteOptions[] => {
		return [
			this.create(),
			this.getAll(),
			this.getById(),
			this.update(),
			this.delete(),
		];
	};
}

