import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { PackageController } from "./package.controller";
import { PackageSchema } from "./package.schema";

export class PackageRouteV1 {
	private packageController: PackageController;
	private packageSchema: PackageSchema;

	constructor(mongoClient: MongoClient) {
		this.packageController = new PackageController(mongoClient);
		this.packageSchema = new PackageSchema();
	}

	private create = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/packages",
			schema: {
				tags: ["Packages"],
				summary: "Create a new package",
				description: "Cria uma nova encomenda no sistema",
				...this.packageSchema.create,
			},
			handler: this.packageController.createPackage.bind(
				this.packageController,
			) as RouteHandlerMethod,
		};
	};

	private getPending = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/packages/pending",
			schema: {
				tags: ["Packages"],
				summary: "Get all pending packages",
				description: "Lista todas as encomendas pendentes",
				...this.packageSchema.getPending,
			},
			handler: this.packageController.getPendingPackages.bind(
				this.packageController,
			) as RouteHandlerMethod,
		};
	};

	private getDelivered = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/packages/delivered",
			schema: {
				tags: ["Packages"],
				summary: "Get all delivered packages",
				description: "Lista todas as encomendas entregues",
				...this.packageSchema.getDelivered,
			},
			handler: this.packageController.getDeliveredPackages.bind(
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
				description: "Busca uma encomenda específica por ID",
				...this.packageSchema.getById,
			},
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
				description: "Confirma a entrega de uma encomenda",
				...this.packageSchema.confirmDelivery,
			},
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
					"Lista as quantidades total de packages pendentes, entregues hoje e entregues na semana",
				...this.packageSchema.getStats,
			},
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
				description: "Cancela uma encomenda",
				...this.packageSchema.cancel,
			},
			handler: this.packageController.cancelPackage.bind(
				this.packageController,
			) as RouteHandlerMethod,
		};
	};

	private getCancelled = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/packages/cancelled",
			schema: {
				tags: ["Packages"],
				summary: "Get all cancelled packages",
				description: "Lista todas as encomendas canceladas nos últimos dias",
				...this.packageSchema.getCancelled,
			},
			handler: this.packageController.getCancelledPackages.bind(
				this.packageController,
			) as RouteHandlerMethod,
		};
	};

	public routes = (): RouteOptions[] => {
		return [
			this.create(),
			this.getPending(),
			this.getDelivered(),
			this.getById(),
			this.confirmDelivery(),
			this.getStats(),
			this.cancel(),
			this.getCancelled(),
		];
	};
}

