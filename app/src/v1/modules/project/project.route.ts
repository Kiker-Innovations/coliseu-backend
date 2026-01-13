import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { ProjectController } from "./project.controller";
import { ProjectSchema } from "./project.schema";
import { AuthMiddleware } from "../auth/auth.middleware";

const MODULE_TAG = "project";

export class ProjectRouteV1 {
	private projectController: ProjectController;
	private projectSchema: ProjectSchema;
	private authMiddleware: AuthMiddleware;

	constructor(mongoClient: MongoClient) {
		this.projectController = new ProjectController(mongoClient);
		this.projectSchema = new ProjectSchema();
		this.authMiddleware = new AuthMiddleware(mongoClient);
	}

	private create = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/projects",
			schema: {
				tags: ["Projects"],
				summary: "Create a new project",
				description:
					"Cria um novo projeto para o prédio do administrador na temporada atual",
				...this.projectSchema.create,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "create"),
			],
			handler: this.projectController.createProject.bind(
				this.projectController,
			) as RouteHandlerMethod,
		};
	};

	private getAllByBuildingAndSeason = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/projects",
			schema: {
				tags: ["Projects"],
				summary: "Get all projects by building and season",
				description: "Lista todos os projetos do prédio na temporada atual",
				...this.projectSchema.getAllByBuildingAndSeason,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.projectController.getAllProjectsByBuildingAndSeason.bind(
				this.projectController,
			) as RouteHandlerMethod,
		};
	};

	private getById = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/projects/:id",
			schema: {
				tags: ["Projects"],
				summary: "Get project by ID",
				description: "Busca um projeto específico por ID",
				...this.projectSchema.getById,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.projectController.getProjectById.bind(
				this.projectController,
			) as RouteHandlerMethod,
		};
	};

	private getPendingPayments = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/projects/pending-payments",
			schema: {
				tags: ["Projects"],
				summary: "Get projects with pending payments",
				description:
					"Lista todos os projetos com ofertas escolhidas que ainda possuem parcelas pendentes",
				...this.projectSchema.getPendingPayments,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.projectController.getProjectsWithPendingPayments.bind(
				this.projectController,
			) as RouteHandlerMethod,
		};
	};

	private update = (): RouteOptions => {
		return {
			method: "PUT",
			url: "/v1/projects/:id",
			schema: {
				tags: ["Projects"],
				summary: "Update project",
				description: "Atualiza um projeto existente",
				...this.projectSchema.update,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "update"),
			],
			handler: this.projectController.updateProject.bind(
				this.projectController,
			) as RouteHandlerMethod,
		};
	};

	private delete = (): RouteOptions => {
		return {
			method: "DELETE",
			url: "/v1/projects/:id",
			schema: {
				tags: ["Projects"],
				summary: "Delete project",
				description: "Deleta um projeto existente e todas as suas ofertas",
				...this.projectSchema.delete,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "delete"),
			],
			handler: this.projectController.deleteProject.bind(
				this.projectController,
			) as RouteHandlerMethod,
		};
	};

	public routes = (): RouteOptions[] => {
		return [
			this.create(),
			this.getPendingPayments(),
			this.getAllByBuildingAndSeason(),
			this.getById(),
			this.update(),
			this.delete(),
		];
	};
}
