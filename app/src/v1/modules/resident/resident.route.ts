import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { ResidentController } from "./resident.controller";
import { ResidentSchema } from "./resident.schema";

export class ResidentRouteV1 {
	private residentController: ResidentController;
	private residentSchema: ResidentSchema;

	constructor(mongoClient: MongoClient) {
		this.residentController = new ResidentController(mongoClient);
		this.residentSchema = new ResidentSchema();
	}

	private create = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/residents",
			schema: {
				tags: ["Residents"],
				summary: "Create a new resident",
				description:
					"Cria um novo morador no sistema e envia email de confirmação",
				...this.residentSchema.create,
			},
			handler: this.residentController.createResident.bind(
				this.residentController,
			) as RouteHandlerMethod,
		};
	};

	private getById = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/residents/:id",
			schema: {
				tags: ["Residents"],
				summary: "Get resident by ID",
				description: "Busca um morador específico por ID",
				...this.residentSchema.getById,
			},
			handler: this.residentController.getResident.bind(
				this.residentController,
			) as RouteHandlerMethod,
		};
	};

	private update = (): RouteOptions => {
		return {
			method: "PUT",
			url: "/v1/residents/:id",
			schema: {
				tags: ["Residents"],
				summary: "Update resident",
				description: "Atualiza dados de um morador (phone, photoUrl)",
				...this.residentSchema.update,
			},
			handler: this.residentController.updateResident.bind(
				this.residentController,
			) as RouteHandlerMethod,
		};
	};

	private remove = (): RouteOptions => {
		return {
			method: "DELETE",
			url: "/v1/residents/:id",
			schema: {
				tags: ["Residents"],
				summary: "Delete resident",
				description: "Remove um morador do sistema",
				...this.residentSchema.remove,
			},
			handler: this.residentController.deleteResident.bind(
				this.residentController,
			) as RouteHandlerMethod,
		};
	};

	private confirm = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/residents/confirm",
			schema: {
				tags: ["Residents"],
				summary: "Confirm resident email",
				description: "Confirma o código de verificação enviado por email",
				...this.residentSchema.confirm,
			},
			handler: this.residentController.confirmResident.bind(
				this.residentController,
			) as RouteHandlerMethod,
		};
	};

	public routes = (): RouteOptions[] => {
		return [
			this.create(),
			this.getById(),
			this.update(),
			this.remove(),
			this.confirm(),
		];
	};
}
