import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { PollController } from "./poll.controller";
import { PollSchema } from "./poll.schema";

export class PollRouteV1 {
	private pollController: PollController;
	private pollSchema: PollSchema;

	constructor(mongoClient: MongoClient) {
		this.pollController = new PollController(mongoClient);
		this.pollSchema = new PollSchema();
	}

	private create = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/polls",
			schema: {
				tags: ["Polls"],
				summary: "Create a new poll",
				description: "Cria uma nova enquete no sistema",
				...this.pollSchema.create,
			},
			handler: this.pollController.createPoll.bind(
				this.pollController,
			) as RouteHandlerMethod,
		};
	};

	private getActive = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/polls/active",
			schema: {
				tags: ["Polls"],
				summary: "Get all active polls",
				description: "Lista todas as enquetes ativas de um mês/ano específico",
				...this.pollSchema.getActive,
			},
			handler: this.pollController.getActivePolls.bind(
				this.pollController,
			) as RouteHandlerMethod,
		};
	};

	private getFinishedAndCancelled = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/polls/finished-cancelled",
			schema: {
				tags: ["Polls"],
				summary: "Get all finished and cancelled polls",
				description: "Lista todas as enquetes encerradas e canceladas de um mês/ano específico",
				...this.pollSchema.getFinishedAndCancelled,
			},
			handler: this.pollController.getFinishedAndCancelledPolls.bind(
				this.pollController,
			) as RouteHandlerMethod,
		};
	};

	private getActiveStats = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/polls/active/stats",
			schema: {
				tags: ["Polls"],
				summary: "Get active polls statistics",
				description: "Retorna estatísticas das enquetes ativas: total de polls, total de votos e percentual em relação aos residents",
				...this.pollSchema.getActiveStats,
			},
			handler: this.pollController.getActivePollsStats.bind(
				this.pollController,
			) as RouteHandlerMethod,
		};
	};

	public routes = (): RouteOptions[] => {
		return [
			this.create(),
			this.getActive(),
			this.getFinishedAndCancelled(),
			this.getActiveStats(),
		];
	};
}

