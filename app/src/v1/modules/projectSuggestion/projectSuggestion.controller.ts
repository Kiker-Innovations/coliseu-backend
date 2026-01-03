import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import { httpException } from "../../../config/error";
import {
  transformProjectSuggestionStartVotingDto,
  transformProjectSuggestionVoteDto,
  transformProjectSuggestionCreateProjectsDto,
} from "./dto";
import { ProjectSuggestionService } from "./projectSuggestion.service";
import { UserTypeEnum } from "../../enum/userType.enum";

export class ProjectSuggestionController {
  private projectSuggestionService: ProjectSuggestionService;

  constructor(mongoClient: MongoClient) {
    this.projectSuggestionService = new ProjectSuggestionService(mongoClient);
  }

  public async rankSuggestions(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (request.user.userType !== UserTypeEnum.ADMIN) {
      throw httpException(
        "Apenas administradores podem rankear sugestões",
        httpStatus.FORBIDDEN
      );
    }

    const { seasonId } = request.params as { seasonId: string };

    return reply
      .code(httpStatus.CREATED)
      .send(
        await this.projectSuggestionService.rankSuggestions(
          seasonId,
          request.user.buildingId
        )
      );
  }

  public async getBySeasonId(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { seasonId } = request.params as { seasonId: string };

    return reply
      .status(httpStatus.OK)
      .send(
        await this.projectSuggestionService.getBySeasonId(
          seasonId,
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
        "Apenas administradores podem iniciar votação",
        httpStatus.FORBIDDEN
      );
    }

    const { seasonId } = request.params as { seasonId: string };

    return reply
      .status(httpStatus.OK)
      .send(
        await this.projectSuggestionService.startVoting(
          seasonId,
          transformProjectSuggestionStartVotingDto(request.body),
          request.user.buildingId
        )
      );
  }

  public async endVoting(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (request.user.userType !== UserTypeEnum.ADMIN) {
      throw httpException(
        "Apenas administradores podem encerrar votação",
        httpStatus.FORBIDDEN
      );
    }

    const { seasonId } = request.params as { seasonId: string };

    return reply
      .status(httpStatus.OK)
      .send(
        await this.projectSuggestionService.endVoting(
          seasonId,
          request.user.buildingId
        )
      );
  }

  public async vote(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (request.user.userType !== UserTypeEnum.RESIDENT) {
      throw httpException(
        "Apenas moradores podem votar em sugestões",
        httpStatus.FORBIDDEN
      );
    }

    return reply
      .status(httpStatus.OK)
      .send(
        await this.projectSuggestionService.vote(
          transformProjectSuggestionVoteDto(request.body),
          request.user.userId
        )
      );
  }

  public async deleteVote(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (request.user.userType !== UserTypeEnum.RESIDENT) {
      throw httpException(
        "Apenas moradores podem remover votos",
        httpStatus.FORBIDDEN
      );
    }

    const { projectSuggestionId } = request.params as {
      projectSuggestionId: string;
    };

    return reply
      .status(httpStatus.OK)
      .send(
        await this.projectSuggestionService.deleteVote(
          projectSuggestionId,
          request.user.userId
        )
      );
  }

  public async getMyVotes(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (request.user.userType !== UserTypeEnum.RESIDENT) {
      throw httpException(
        "Apenas moradores podem visualizar seus votos",
        httpStatus.FORBIDDEN
      );
    }

    const { seasonId } = request.params as { seasonId: string };

    return reply
      .status(httpStatus.OK)
      .send(
        await this.projectSuggestionService.getMyVotes(
          seasonId,
          request.user.userId
        )
      );
  }

  public async createProjectsFromTopSuggestions(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (request.user.userType !== UserTypeEnum.ADMIN) {
      throw httpException(
        "Apenas administradores podem criar projetos a partir de sugestões",
        httpStatus.FORBIDDEN
      );
    }

    const { seasonId } = request.params as { seasonId: string };
    const body = request.body || { top: 3 };

    return reply
      .code(httpStatus.CREATED)
      .send(
        await this.projectSuggestionService.createProjectsFromTopSuggestions(
          seasonId,
          transformProjectSuggestionCreateProjectsDto(body),
          request.user.buildingId
        )
      );
  }
}
