import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { PollController } from "./poll.controller";
import { PollVoteController } from "./pollVote.controller";
import { PollSchema } from "./poll.schema";
import { AuthMiddleware } from "../auth/auth.middleware";

export class PollRouteV1 {
	private pollController: PollController;
	private pollVoteController: PollVoteController;
	private pollSchema: PollSchema;
	private authMiddleware: AuthMiddleware;

	constructor(mongoClient: MongoClient) {
		this.pollController = new PollController(mongoClient);
		this.pollVoteController = new PollVoteController(mongoClient);
		this.pollSchema = new PollSchema();
		this.authMiddleware = new AuthMiddleware(mongoClient);
	}

	private create = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/polls",
			schema: {
				tags: ["Polls"],
				summary: "Create a new poll",
				description: "Cria uma nova enquete no sistema. O ID do edifício é obtido automaticamente do token de autenticação do administrador.",
				...this.pollSchema.create,
			},
			preHandler: this.authMiddleware.authenticate,
			handler: this.pollController.createPoll.bind(
				this.pollController,
			) as RouteHandlerMethod,
		};
	};

	private getPollsByStatus = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/polls",
			schema: {
				tags: ["Polls"],
				summary: "Get polls by status",
				description: "Lista enquetes filtradas por status(es) do prédio do administrador. O ID do edifício é obtido automaticamente do token de autenticação. Pode passar um ou mais status: ATIVO, PROGRAMADO, FINALIZADO, CANCELADO",
				...this.pollSchema.getPollsByStatus,
			},
			preHandler: this.authMiddleware.authenticate,
			handler: this.pollController.getPollsByStatus.bind(
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
				description: "Retorna estatísticas das enquetes ativas do prédio do administrador. O ID do edifício é obtido automaticamente do token de autenticação. Retorna: total de polls, total de votos e percentual em relação aos residents",
				querystring: this.pollSchema.getActiveStats.querystring,
				response: this.pollSchema.getActiveStats.response,
			},
			preHandler: this.authMiddleware.authenticate,
			handler: this.pollController.getActivePollsStats.bind(
				this.pollController,
			) as RouteHandlerMethod,
		};
	};

	private cancel = (): RouteOptions => {
		return {
			method: "DELETE",
			url: "/v1/polls/:id/cancel",
			schema: {
				tags: ["Polls"],
				summary: "Cancel a poll",
				description: "Cancela uma enquete do prédio do administrador (safe delete). O ID do edifício é obtido automaticamente do token de autenticação. A enquete não é deletada, apenas muda o status para CANCELADO e registra o motivo do cancelamento",
				...this.pollSchema.cancel,
			},
			preHandler: this.authMiddleware.authenticate,
			handler: this.pollController.cancelPoll.bind(
				this.pollController,
			) as RouteHandlerMethod,
		};
	};

	private vote = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/polls/vote",
			schema: {
				tags: ["Polls"],
			summary: "Vote in a poll",
			description: "Registra ou atualiza o voto de um residente em uma enquete. Se o residente já votou, atualiza o voto para a nova opção escolhida. O ID do residente é obtido automaticamente do token de autenticação.",
				...this.pollSchema.vote,
			},
			preHandler: this.authMiddleware.authenticate,
			handler: this.pollVoteController.vote.bind(
				this.pollVoteController,
			) as RouteHandlerMethod,
		};
	};

	private deleteVote = (): RouteOptions => {
		return {
			method: "DELETE",
			url: "/v1/polls/:pollId/vote",
			schema: {
				tags: ["Polls"],
				summary: "Delete vote",
				description: "Deleta o voto de um residente em uma enquete. O ID do residente é obtido automaticamente do token de autenticação.",
				...this.pollSchema.deleteVote,
			},
			preHandler: this.authMiddleware.authenticate,
			handler: this.pollVoteController.deleteVote.bind(
				this.pollVoteController,
			) as RouteHandlerMethod,
		};
	};

	private getMyVote = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/polls/:pollId/my-vote",
			schema: {
				tags: ["Polls"],
				summary: "Get my vote in a poll",
				description: "Retorna o voto do residente autenticado em uma enquete específica. O ID do residente é obtido automaticamente do token de autenticação. Retorna null se o residente ainda não votou.",
				...this.pollSchema.getMyVote,
			},
			preHandler: this.authMiddleware.authenticate,
			handler: this.pollVoteController.getMyVote.bind(
				this.pollVoteController,
			) as RouteHandlerMethod,
		};
	};

	public routes = (): RouteOptions[] => {
		return [
			this.create(),
			this.getPollsByStatus(),
			this.getActiveStats(),
			this.cancel(),
			this.vote(),
			this.deleteVote(),
			this.getMyVote(),
		];
	};
}

