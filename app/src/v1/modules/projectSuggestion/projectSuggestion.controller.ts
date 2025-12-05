import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import { httpException } from "../../../config/error";
import {
  transformUpdateProjectSuggestionDto,
  transformStartVotingDto,
} from "./dto";
import { ProjectSuggestionService } from "./projectSuggestion.service";
import { UserTypeEnum } from "../../enum/userType.enum";

export class ProjectSuggestionController {
  private projectSuggestionService: ProjectSuggestionService;

  constructor(mongoClient: MongoClient) {
    this.projectSuggestionService = new ProjectSuggestionService(mongoClient);
  }

  public async getAllByBuildingAndSeason(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    return reply
      .status(httpStatus.OK)
      .send(
        await this.projectSuggestionService.getAllByBuildingAndSeason(
          request.user.buildingId,
          request.user.actualSeasonId
        )
      );
  }

  public async getById(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { id } = request.params as { id: string };
    return reply
      .status(httpStatus.OK)
      .send(
        await this.projectSuggestionService.getById(id, request.user.buildingId)
      );
  }

  public async update(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (request.user.userType !== UserTypeEnum.ADMIN) {
      throw httpException(
        "Apenas administradores podem atualizar sugestões de projeto",
        httpStatus.FORBIDDEN
      );
    }

    const { id } = request.params as { id: string };
    return reply
      .status(httpStatus.OK)
      .send(
        await this.projectSuggestionService.update(
          id,
          transformUpdateProjectSuggestionDto(request.body),
          request.user.buildingId
        )
      );
  }

  public async startVoting(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (request.user.userType !== UserTypeEnum.ADMIN) {
      throw httpException(
        "Apenas administradores podem iniciar o período de votação",
        httpStatus.FORBIDDEN
      );
    }

    const { seasonId } = request.params as { seasonId: string };
    return reply
      .status(httpStatus.OK)
      .send(
        await this.projectSuggestionService.startVoting(
          seasonId,
          transformStartVotingDto(request.body),
          request.user.buildingId
        )
      );
  }

  public async delete(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (request.user.userType !== UserTypeEnum.ADMIN) {
      throw httpException(
        "Apenas administradores podem deletar sugestões de projeto",
        httpStatus.FORBIDDEN
      );
    }

    const { id } = request.params as { id: string };
    return reply
      .status(httpStatus.OK)
      .send(
        await this.projectSuggestionService.delete(id, request.user.buildingId)
      );
  }
}
