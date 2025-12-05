import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { ProjectSuggestionPollController } from "./projectSuggestionPoll.controller";
import { ProjectSuggestionPollSchema } from "./projectSuggestionPoll.schema";
import { AuthMiddleware } from "../auth/auth.middleware";

export class ProjectSuggestionPollRouteV1 {
  private projectSuggestionPollController: ProjectSuggestionPollController;
  private projectSuggestionPollSchema: ProjectSuggestionPollSchema;
  private authMiddleware: AuthMiddleware;

  constructor(mongoClient: MongoClient) {
    this.projectSuggestionPollController = new ProjectSuggestionPollController(
      mongoClient
    );
    this.projectSuggestionPollSchema = new ProjectSuggestionPollSchema();
    this.authMiddleware = new AuthMiddleware(mongoClient);
  }

  private vote = (): RouteOptions => {
    return {
      method: "POST",
      url: "/v1/project-suggestion-polls/vote",
      schema: {
        tags: ["Project Suggestion Polls"],
        summary: "Vote in a project suggestion",
        description:
          "Registra ou atualiza o voto de um morador em uma sugestão de projeto. Cada morador tem até 3 votos no total que podem ser distribuídos entre as sugestões.",
        ...this.projectSuggestionPollSchema.vote,
      },
      preHandler: this.authMiddleware.authenticate,
      handler: this.projectSuggestionPollController.vote.bind(
        this.projectSuggestionPollController
      ) as RouteHandlerMethod,
    };
  };

  private deleteVote = (): RouteOptions => {
    return {
      method: "DELETE",
      url: "/v1/project-suggestion-polls/:projectSuggestionId/vote",
      schema: {
        tags: ["Project Suggestion Polls"],
        summary: "Delete vote from a project suggestion",
        description: "Remove o voto de um morador em uma sugestão de projeto.",
        ...this.projectSuggestionPollSchema.deleteVote,
      },
      preHandler: this.authMiddleware.authenticate,
      handler: this.projectSuggestionPollController.deleteVote.bind(
        this.projectSuggestionPollController
      ) as RouteHandlerMethod,
    };
  };

  private getMyVotes = (): RouteOptions => {
    return {
      method: "GET",
      url: "/v1/project-suggestion-polls/my-votes",
      schema: {
        tags: ["Project Suggestion Polls"],
        summary: "Get my votes in the current season",
        description:
          "Retorna todos os votos do morador autenticado na temporada atual, incluindo quantos votos foram usados e quantos restam.",
        ...this.projectSuggestionPollSchema.getMyVotes,
      },
      preHandler: this.authMiddleware.authenticate,
      handler: this.projectSuggestionPollController.getMyVotes.bind(
        this.projectSuggestionPollController
      ) as RouteHandlerMethod,
    };
  };

  private getMyVoteOnSuggestion = (): RouteOptions => {
    return {
      method: "GET",
      url: "/v1/project-suggestion-polls/:projectSuggestionId/my-vote",
      schema: {
        tags: ["Project Suggestion Polls"],
        summary: "Get my vote on a specific project suggestion",
        description:
          "Retorna o voto do morador autenticado em uma sugestão de projeto específica.",
        ...this.projectSuggestionPollSchema.getMyVoteOnSuggestion,
      },
      preHandler: this.authMiddleware.authenticate,
      handler: this.projectSuggestionPollController.getMyVoteOnSuggestion.bind(
        this.projectSuggestionPollController
      ) as RouteHandlerMethod,
    };
  };

  public routes = (): RouteOptions[] => {
    return [
      this.vote(),
      this.deleteVote(),
      this.getMyVotes(),
      this.getMyVoteOnSuggestion(),
    ];
  };
}
