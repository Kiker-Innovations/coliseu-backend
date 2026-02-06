import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { InfractionController } from "./infraction.controller";
import { InfractionSchema } from "./infraction.schema";
import { AuthMiddleware } from "../auth/auth.middleware";

const MODULE_TAG = "infraction";

export class InfractionRouteV1 {
	private infractionController: InfractionController;
	private infractionSchema: InfractionSchema;
	private authMiddleware: AuthMiddleware;

	constructor(mongoClient: MongoClient) {
		this.infractionController = new InfractionController(mongoClient);
		this.infractionSchema = new InfractionSchema();
		this.authMiddleware = new AuthMiddleware(mongoClient);
	}

	private createFine = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/infractions/fine",
			schema: {
				tags: ["Infractions"],
				summary: "Apply fine to apartment",
				description: "Aplica uma multa a um apartamento (apenas admin)",
				...this.infractionSchema.createFine,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "create"),
			],
			handler: this.infractionController.createFineInfraction.bind(
				this.infractionController,
			) as RouteHandlerMethod,
		};
	};

	private createNotification = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/infractions/notification",
			schema: {
				tags: ["Infractions"],
				summary: "Apply notification to apartment",
				description: "Aplica uma notificação a um apartamento (apenas admin)",
				...this.infractionSchema.createNotification,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "create"),
			],
			handler: this.infractionController.createNotificationInfraction.bind(
				this.infractionController,
			) as RouteHandlerMethod,
		};
	};

	private getAll = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/infractions",
			schema: {
				tags: ["Infractions"],
				summary: "Get all infractions",
				description: "Lista todas as infrações com filtros opcionais",
				...this.infractionSchema.getAll,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.infractionController.getInfractions.bind(
				this.infractionController,
			) as RouteHandlerMethod,
		};
	};

	private getMyFines = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/infractions/my-fines",
			schema: {
				tags: ["Infractions"],
				summary: "Get my fines",
				description:
					"Lista as multas do morador autenticado, ordenadas por data (apenas resident)",
				...this.infractionSchema.getMyFines,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.infractionController.getMyFines.bind(
				this.infractionController,
			) as RouteHandlerMethod,
		};
	};

	private contestInfraction = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/infractions/contest",
			schema: {
				tags: ["Infractions"],
				summary: "Contest infraction",
				description:
					"Contesta uma infração com texto e arquivo de evidência (apenas resident)",
				...this.infractionSchema.contestInfraction,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "create"),
			],
			handler: this.infractionController.contestInfraction.bind(
				this.infractionController,
			) as RouteHandlerMethod,
		};
	};

	private getInfractionAppeal = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/infractions/:infractionId/appeal",
			schema: {
				tags: ["Infractions"],
				summary: "Get infraction appeal",
				description: "Busca a contestação de uma infração (apenas resident)",
				...this.infractionSchema.getInfractionAppeal,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.infractionController.getInfractionAppeal.bind(
				this.infractionController,
			) as RouteHandlerMethod,
		};
	};

	private approveAppeal = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/infractions/:infractionId/appeal/approve",
			schema: {
				tags: ["Infractions"],
				summary: "Approve appeal",
				description:
					"Aprova a contestação de uma infração, cancelando a multa (apenas admin)",
				...this.infractionSchema.approveAppeal,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "update"),
			],
			handler: this.infractionController.approveAppeal.bind(
				this.infractionController,
			) as RouteHandlerMethod,
		};
	};

	private rejectAppeal = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/infractions/:infractionId/appeal/reject",
			schema: {
				tags: ["Infractions"],
				summary: "Reject appeal",
				description:
					"Reprova a contestação de uma infração, voltando a multa para pendente (apenas admin)",
				...this.infractionSchema.rejectAppeal,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "update"),
			],
			handler: this.infractionController.rejectAppeal.bind(
				this.infractionController,
			) as RouteHandlerMethod,
		};
	};

	private getInfractionAppealForAdmin = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/infractions/:infractionId/appeal/admin",
			schema: {
				tags: ["Infractions"],
				summary: "Get infraction appeal for admin",
				description: "Busca a contestação de uma infração (apenas admin)",
				...this.infractionSchema.getInfractionAppealForAdmin,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.infractionController.getInfractionAppealForAdmin.bind(
				this.infractionController,
			) as RouteHandlerMethod,
		};
	};

	private cancelNotification = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/infractions/:infractionId/cancel-notification",
			schema: {
				tags: ["Infractions"],
				summary: "Cancel notification",
				description: "Cancela uma notificação ativa (apenas admin)",
				...this.infractionSchema.cancelNotification,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "update"),
			],
			handler: this.infractionController.cancelNotification.bind(
				this.infractionController,
			) as RouteHandlerMethod,
		};
	};

	public routes = (): RouteOptions[] => {
		return [
			this.createFine(),
			this.createNotification(),
			this.getAll(),
			this.getMyFines(),
			this.contestInfraction(),
			this.getInfractionAppeal(),
			this.approveAppeal(),
			this.rejectAppeal(),
			this.getInfractionAppealForAdmin(),
			this.cancelNotification(),
		];
	};
}
