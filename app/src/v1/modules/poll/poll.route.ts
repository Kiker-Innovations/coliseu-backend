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
				description: "Cria uma nova enquete no sistema",
				...this.pollSchema.create,
			},
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
				description: "Lista enquetes filtradas por status(es). Pode passar um ou mais status: ATIVO, PROGRAMADO, FINALIZADO, CANCELADO",
				querystring: {
					type: "object",
					required: ["buildingId", "month", "year", "status"],
					properties: {
						buildingId: {
							type: "string",
							format: "uuid",
							description: "ID do edifício",
							example: "b2ce3bcd-6309-42a5-861c-33bdefb7ab33",
						},
						month: {
							type: "integer",
							minimum: 1,
							maximum: 12,
							description: "Mês (1-12)",
							example: 11,
						},
						year: {
							type: "integer",
							minimum: 2000,
							maximum: 2100,
							description: "Ano",
							example: 2025,
						},
						status: {
							anyOf: [
								{
									type: "string",
									enum: ["ATIVO", "PROGRAMADO", "FINALIZADO", "CANCELADO"],
									description: "Status único",
									example: "ATIVO",
								},
								{
									type: "array",
									items: {
										type: "string",
										enum: ["ATIVO", "PROGRAMADO", "FINALIZADO", "CANCELADO"],
									},
									description: "Array de status",
									example: ["ATIVO", "PROGRAMADO"],
								},
							],
							description: "Status para filtrar. Pode ser string única, array, ou string separada por vírgula",
						},
					},
				},
				response: {
					200: {
						description: "Enquetes encontradas",
						type: "object",
						properties: {
							success: { type: "boolean", example: true },
							message: { type: "string", example: "Enquetes encontradas com sucesso" },
							data: {
								type: "array",
								items: {
									type: "object",
									properties: {
										id: { type: "string", example: "8a02e8c9-cd30-44fb-b209-02e5b66434fb" },
										description: { type: "string", example: "Qual seria o horário ideal para o funcionamento da academia" },
										startDate: { type: "string", format: "date-time", example: "2025-11-23T03:00:00.000Z" },
										endDate: { type: "string", format: "date-time", example: "2025-11-25T02:59:59.999Z" },
										votes: { type: "integer", example: 0 },
										options: {
											type: "array",
											items: {
												type: "object",
												properties: {
													id: { type: "integer", example: 0 },
													description: { type: "string", example: "Opção 1" },
													votes: { type: "integer", example: 0 },
													percent: { type: "number", example: 0 },
												},
											},
										},
										status: { type: "string", example: "ATIVO" },
										cancelReason: { type: "string" },
										cancelledAt: { type: "string", format: "date-time" },
									},
								},
							},
						},
					},
				},
			},
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
				description: "Retorna estatísticas das enquetes ativas: total de polls, total de votos e percentual em relação aos residents",
				querystring: this.pollSchema.getActiveStats.querystring,
				response: this.pollSchema.getActiveStats.response,
			},
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
				description: "Cancela uma enquete (safe delete). A enquete não é deletada, apenas muda o status para CANCELADO e registra o motivo do cancelamento",
				...this.pollSchema.cancel,
			},
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

