import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { SeasonController } from "./season.controller";
import { SeasonSchema } from "./season.schema";

export class SeasonRouteV1 {
  private seasonController: SeasonController;
  private seasonSchema: SeasonSchema;

  constructor(mongoClient: MongoClient) {
    this.seasonController = new SeasonController(mongoClient);
    this.seasonSchema = new SeasonSchema();
  }

  private create = (): RouteOptions => {
    return {
      method: "POST",
      url: "/v1/seasons",
      schema: {
        tags: ["Seasons"],
        summary: "Create a new season",
        description: "Cria uma nova season para o prédio do administrador",
        ...this.seasonSchema.create,
      },
      handler: this.seasonController.createSeason.bind(
        this.seasonController
      ) as RouteHandlerMethod,
    };
  };

  private getAllByBuilding = (): RouteOptions => {
    return {
      method: "GET",
      url: "/v1/seasons",
      schema: {
        tags: ["Seasons"],
        summary: "Get all seasons by building",
        description: "Lista todas as seasons do prédio do administrador",
        ...this.seasonSchema.getAllByBuilding,
      },
      handler: this.seasonController.getAllSeasonsByBuilding.bind(
        this.seasonController
      ) as RouteHandlerMethod,
    };
  };

  private getById = (): RouteOptions => {
    return {
      method: "GET",
      url: "/v1/seasons/:id",
      schema: {
        tags: ["Seasons"],
        summary: "Get season by ID",
        description: "Busca uma season específica por ID",
        ...this.seasonSchema.getById,
      },
      handler: this.seasonController.getSeasonById.bind(
        this.seasonController
      ) as RouteHandlerMethod,
    };
  };

  private update = (): RouteOptions => {
    return {
      method: "PUT",
      url: "/v1/seasons/:id",
      schema: {
        tags: ["Seasons"],
        summary: "Update season",
        description: "Atualiza uma season existente",
        ...this.seasonSchema.update,
      },
      handler: this.seasonController.updateSeason.bind(
        this.seasonController
      ) as RouteHandlerMethod,
    };
  };

  private finish = (): RouteOptions => {
    return {
      method: "PATCH",
      url: "/v1/seasons/:id/finish",
      schema: {
        tags: ["Seasons"],
        summary: "Finish season",
        description: "Finaliza uma season, definindo o endDate",
        ...this.seasonSchema.finish,
      },
      handler: this.seasonController.finishSeason.bind(
        this.seasonController
      ) as RouteHandlerMethod,
    };
  };

  private delete = (): RouteOptions => {
    return {
      method: "DELETE",
      url: "/v1/seasons/:id",
      schema: {
        tags: ["Seasons"],
        summary: "Delete season",
        description: "Deleta uma season existente",
        ...this.seasonSchema.delete,
      },
      handler: this.seasonController.deleteSeason.bind(
        this.seasonController
      ) as RouteHandlerMethod,
    };
  };

  private rankSuggestions = (): RouteOptions => {
    return {
      method: "POST",
      url: "/v1/seasons/:id/rank-suggestions",
      schema: {
        tags: ["Seasons"],
        summary: "Rank suggestions",
        description:
          "Processa todas as sugestões da temporada, remove duplicatas e cria a lista de sugestões de projeto ranqueadas",
        ...this.seasonSchema.rankSuggestions,
      },
      handler: this.seasonController.rankSuggestions.bind(
        this.seasonController
      ) as RouteHandlerMethod,
    };
  };

  private promoteToProjects = (): RouteOptions => {
    return {
      method: "POST",
      url: "/v1/seasons/:id/promote-to-projects",
      schema: {
        tags: ["Seasons"],
        summary: "Promote suggestions to projects",
        description:
          "Transforma as sugestões de projeto mais votadas em projetos oficiais",
        ...this.seasonSchema.promoteToProjects,
      },
      handler: this.seasonController.promoteToProjects.bind(
        this.seasonController
      ) as RouteHandlerMethod,
    };
  };

  public routes = (): RouteOptions[] => {
    return [
      this.create(),
      this.getAllByBuilding(),
      this.getById(),
      this.update(),
      this.finish(),
      this.delete(),
      this.rankSuggestions(),
      this.promoteToProjects(),
    ];
  };
}
