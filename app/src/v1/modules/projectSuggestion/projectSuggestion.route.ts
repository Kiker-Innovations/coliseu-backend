import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { ProjectSuggestionController } from "./projectSuggestion.controller";
import { ProjectSuggestionSchema } from "./projectSuggestion.schema";

export class ProjectSuggestionRouteV1 {
  private projectSuggestionController: ProjectSuggestionController;
  private projectSuggestionSchema: ProjectSuggestionSchema;

  constructor(mongoClient: MongoClient) {
    this.projectSuggestionController = new ProjectSuggestionController(
      mongoClient
    );
    this.projectSuggestionSchema = new ProjectSuggestionSchema();
  }

  private getAllByBuildingAndSeason = (): RouteOptions => {
    return {
      method: "GET",
      url: "/v1/project-suggestions",
      schema: {
        tags: ["Project Suggestions"],
        summary: "Get all project suggestions by building and season",
        description:
          "Lista todas as sugestões de projeto do prédio na temporada atual",
        ...this.projectSuggestionSchema.getAllByBuildingAndSeason,
      },
      handler: this.projectSuggestionController.getAllByBuildingAndSeason.bind(
        this.projectSuggestionController
      ) as RouteHandlerMethod,
    };
  };

  private getById = (): RouteOptions => {
    return {
      method: "GET",
      url: "/v1/project-suggestions/:id",
      schema: {
        tags: ["Project Suggestions"],
        summary: "Get project suggestion by ID",
        description: "Busca uma sugestão de projeto específica por ID",
        ...this.projectSuggestionSchema.getById,
      },
      handler: this.projectSuggestionController.getById.bind(
        this.projectSuggestionController
      ) as RouteHandlerMethod,
    };
  };

  private update = (): RouteOptions => {
    return {
      method: "PUT",
      url: "/v1/project-suggestions/:id",
      schema: {
        tags: ["Project Suggestions"],
        summary: "Update project suggestion",
        description:
          "Atualiza uma sugestão de projeto existente (apenas antes do início da votação)",
        ...this.projectSuggestionSchema.update,
      },
      handler: this.projectSuggestionController.update.bind(
        this.projectSuggestionController
      ) as RouteHandlerMethod,
    };
  };

  private startVoting = (): RouteOptions => {
    return {
      method: "POST",
      url: "/v1/project-suggestions/seasons/:seasonId/start-voting",
      schema: {
        tags: ["Project Suggestions"],
        summary: "Start voting period",
        description:
          "Define o período de votação para as sugestões de projeto de uma temporada",
        ...this.projectSuggestionSchema.startVoting,
      },
      handler: this.projectSuggestionController.startVoting.bind(
        this.projectSuggestionController
      ) as RouteHandlerMethod,
    };
  };

  private delete = (): RouteOptions => {
    return {
      method: "DELETE",
      url: "/v1/project-suggestions/:id",
      schema: {
        tags: ["Project Suggestions"],
        summary: "Delete project suggestion",
        description: "Deleta uma sugestão de projeto existente",
        ...this.projectSuggestionSchema.delete,
      },
      handler: this.projectSuggestionController.delete.bind(
        this.projectSuggestionController
      ) as RouteHandlerMethod,
    };
  };

  public routes = (): RouteOptions[] => {
    return [
      this.getAllByBuildingAndSeason(),
      this.getById(),
      this.update(),
      this.startVoting(),
      this.delete(),
    ];
  };
}
