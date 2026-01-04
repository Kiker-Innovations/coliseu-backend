import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { InfractionController } from "./infraction.controller";
import { InfractionSchema } from "./infraction.schema";

export class InfractionRouteV1 {
	private infractionController: InfractionController;
	private infractionSchema: InfractionSchema;

	constructor(mongoClient: MongoClient) {
		this.infractionController = new InfractionController(mongoClient);
		this.infractionSchema = new InfractionSchema();
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
			handler: this.infractionController.createFineInfraction.bind(
				this.infractionController
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
			handler: this.infractionController.createNotificationInfraction.bind(
				this.infractionController
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
			handler: this.infractionController.getInfractions.bind(
				this.infractionController
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
				description: "Lista as multas do morador autenticado, ordenadas por data (apenas resident)",
				...this.infractionSchema.getMyFines,
			},
			handler: this.infractionController.getMyFines.bind(
				this.infractionController
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
				description: "Contesta uma infração com texto e arquivo de evidência (apenas resident)",
				...this.infractionSchema.contestInfraction,
			},
			handler: this.infractionController.contestInfraction.bind(
				this.infractionController
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
			handler: this.infractionController.getInfractionAppeal.bind(
				this.infractionController
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
				description: "Aprova a contestação de uma infração, cancelando a multa (apenas admin)",
				...this.infractionSchema.approveAppeal,
			},
			handler: this.infractionController.approveAppeal.bind(
				this.infractionController
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
				description: "Reprova a contestação de uma infração, voltando a multa para pendente (apenas admin)",
				...this.infractionSchema.rejectAppeal,
			},
			handler: this.infractionController.rejectAppeal.bind(
				this.infractionController
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
			handler: this.infractionController.getInfractionAppealForAdmin.bind(
				this.infractionController
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
		];
	};
}

