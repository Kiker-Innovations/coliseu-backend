import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { PackageController } from "./package.controller";
import { PackageSchema } from "./package.schema";
import { AuthMiddleware } from "../auth/auth.middleware";

export class PackageRouteV1 {
	private packageController: PackageController;
	private packageSchema: PackageSchema;
	private authMiddleware: AuthMiddleware;

	constructor(mongoClient: MongoClient) {
		this.packageController = new PackageController(mongoClient);
		this.packageSchema = new PackageSchema();
		this.authMiddleware = new AuthMiddleware(mongoClient);
	}

	private create = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/packages",
			schema: {
				tags: ["Packages"],
				summary: "Create a new package",
				description: "Cria uma nova encomenda no sistema. O ID do porteiro e do edifício são obtidos automaticamente do token de autenticação.",
				...this.packageSchema.create,
			},
			preHandler: this.authMiddleware.authenticate,
			handler: this.packageController.createPackage.bind(
				this.packageController,
			) as RouteHandlerMethod,
		};
	};

	private getPackages = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/packages",
			schema: {
				tags: ["Packages"],
				summary: "Get packages",
				description: "Lista as encomendas do edifício do porteiro autenticado. Opcionalmente filtra por status (PENDENTE, ENTREGUE, CANCELADO). Para CANCELADO, pode-se passar o parâmetro 'days' para filtrar por dias (padrão: 7).",
				...this.packageSchema.getPackages,
			},
			preHandler: this.authMiddleware.authenticate,
			handler: this.packageController.getPackages.bind(
				this.packageController,
			) as RouteHandlerMethod,
		};
	};

	private getById = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/packages/:id",
			schema: {
				tags: ["Packages"],
				summary: "Get package by ID",
				description: "Busca uma encomenda específica por ID do edifício do porteiro autenticado",
				...this.packageSchema.getById,
			},
			preHandler: this.authMiddleware.authenticate,
			handler: this.packageController.getPackageById.bind(
				this.packageController,
			) as RouteHandlerMethod,
		};
	};

	private confirmDelivery = (): RouteOptions => {
		return {
			method: "PUT",
			url: "/v1/packages/:id/confirm-delivery",
			schema: {
				tags: ["Packages"],
				summary: "Confirm package delivery",
				description: "Confirma a entrega de uma encomenda. O ID do porteiro é obtido automaticamente do token de autenticação.",
				...this.packageSchema.confirmDelivery,
			},
			preHandler: this.authMiddleware.authenticate,
			handler: this.packageController.confirmDelivery.bind(
				this.packageController,
			) as RouteHandlerMethod,
		};
	};

	private getStats = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/packages/stats",
			schema: {
				tags: ["Packages"],
				summary: "Get package statistics",
				description:
					"Lista as quantidades total de packages pendentes, entregues hoje e entregues na semana do edifício do porteiro autenticado",
				...this.packageSchema.getStats,
			},
			preHandler: this.authMiddleware.authenticate,
			handler: this.packageController.getPackageStats.bind(
				this.packageController,
			) as RouteHandlerMethod,
		};
	};

	private cancel = (): RouteOptions => {
		return {
			method: "PUT",
			url: "/v1/packages/:id/cancel",
			schema: {
				tags: ["Packages"],
				summary: "Cancel a package",
				description: "Cancela uma encomenda. O ID do porteiro é obtido automaticamente do token de autenticação.",
				...this.packageSchema.cancel,
			},
			preHandler: this.authMiddleware.authenticate,
			handler: this.packageController.cancelPackage.bind(
				this.packageController,
			) as RouteHandlerMethod,
		};
	};


	private getMyPackages = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/packages/my-packages",
			schema: {
				tags: ["Packages"],
				summary: "Get my packages",
				description: "Lista as encomendas do apartamento do morador autenticado. Opcionalmente filtra por status (PENDENTE, ENTREGUE, CANCELADO).",
				...this.packageSchema.getMyPackages,
			},
			preHandler: this.authMiddleware.authenticate,
			handler: this.packageController.getMyPackages.bind(
				this.packageController,
			) as RouteHandlerMethod,
		};
	};

	private getMyPackageStats = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/packages/my-packages/stats",
			schema: {
				tags: ["Packages"],
				summary: "Get my package statistics",
				description: "Lista as estatísticas de encomendas do apartamento do morador autenticado",
				...this.packageSchema.getMyPackageStats,
			},
			preHandler: this.authMiddleware.authenticate,
			handler: this.packageController.getMyPackageStats.bind(
				this.packageController,
			) as RouteHandlerMethod,
		};
	};

	public routes = (): RouteOptions[] => {
		return [
			this.create(),
			this.getPackages(),
			this.getById(),
			this.confirmDelivery(),
			this.getStats(),
			this.cancel(),
			this.getMyPackages(),
			this.getMyPackageStats(),
		];
	};
}

