import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import { httpException } from "../../../config/error";
import { UserTypeEnum } from "../../enum/userType.enum";
import { transformProjectSuggestionPollVoteDto } from "./dto";
import { ProjectSuggestionPollService } from "./projectSuggestionPoll.service";

export class ProjectSuggestionPollController {
  private projectSuggestionPollService: ProjectSuggestionPollService;

  constructor(mongoClient: MongoClient) {
    this.projectSuggestionPollService = new ProjectSuggestionPollService(
      mongoClient
    );
  }

  public async vote(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (request.user.userType !== UserTypeEnum.RESIDENT) {
      throw httpException(
        "Apenas moradores podem votar em sugestões de projeto",
        httpStatus.FORBIDDEN
      );
    }

    const residentId = request.user.userId;

    return reply
      .status(httpStatus.OK)
      .send(
        await this.projectSuggestionPollService.vote(
          transformProjectSuggestionPollVoteDto(request.body),
          residentId
        )
      );
  }

  public async deleteVote(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (request.user.userType !== UserTypeEnum.RESIDENT) {
      throw httpException(
        "Apenas moradores podem remover votos em sugestões de projeto",
        httpStatus.FORBIDDEN
      );
    }

    const residentId = request.user.userId;
    const { projectSuggestionId } = request.params as {
      projectSuggestionId: string;
    };

    return reply
      .status(httpStatus.OK)
      .send(
        await this.projectSuggestionPollService.deleteVote(
          projectSuggestionId,
          residentId
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

    const residentId = request.user.userId;
    const seasonId = request.user.actualSeasonId;

    return reply
      .status(httpStatus.OK)
      .send(
        await this.projectSuggestionPollService.getMyVotes(seasonId, residentId)
      );
  }

  public async getMyVoteOnSuggestion(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (request.user.userType !== UserTypeEnum.RESIDENT) {
      throw httpException(
        "Apenas moradores podem visualizar seus votos",
        httpStatus.FORBIDDEN
      );
    }

    const residentId = request.user.userId;
    const { projectSuggestionId } = request.params as {
      projectSuggestionId: string;
    };

    return reply
      .status(httpStatus.OK)
      .send(
        await this.projectSuggestionPollService.getMyVoteOnSuggestion(
          projectSuggestionId,
          residentId
        )
      );
  }
}
