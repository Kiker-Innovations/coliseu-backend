import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import { httpException } from "../../../config/error";
import { transformCreateSeasonDto, transformUpdateSeasonDto } from "./dto";
import { SeasonService } from "./season.service";
import { UserTypeEnum } from "../../enum/userType.enum";

export class SeasonController {
  private seasonService: SeasonService;

  constructor(mongoClient: MongoClient) {
    this.seasonService = new SeasonService(mongoClient);
  }

  public async createSeason(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (request.user.userType !== UserTypeEnum.ADMIN) {
      throw httpException(
        "Apenas administradores podem criar seasons",
        httpStatus.FORBIDDEN
      );
    }

    return reply
      .code(httpStatus.CREATED)
      .send(
        await this.seasonService.createSeason(
          transformCreateSeasonDto(request.body),
          request.user.buildingId
        )
      );
  }

  public async getAllSeasonsByBuilding(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    return reply
      .status(httpStatus.OK)
      .send(
        await this.seasonService.getAllSeasonsByBuilding(
          request.user.buildingId
        )
      );
  }

  public async getSeasonById(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (request.user.userType !== UserTypeEnum.ADMIN) {
      throw httpException(
        "Apenas administradores podem visualizar seasons",
        httpStatus.FORBIDDEN
      );
    }

    const { id } = request.params as { id: string };
    return reply
      .status(httpStatus.OK)
      .send(
        await this.seasonService.getSeasonById(id, request.user.buildingId)
      );
  }

  public async updateSeason(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (request.user.userType !== UserTypeEnum.ADMIN) {
      throw httpException(
        "Apenas administradores podem atualizar seasons",
        httpStatus.FORBIDDEN
      );
    }

    const { id } = request.params as { id: string };
    return reply
      .status(httpStatus.OK)
      .send(
        await this.seasonService.updateSeason(
          id,
          transformUpdateSeasonDto(request.body),
          request.user.buildingId
        )
      );
  }

  public async finishSeason(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (request.user.userType !== UserTypeEnum.ADMIN) {
      throw httpException(
        "Apenas administradores podem finalizar seasons",
        httpStatus.FORBIDDEN
      );
    }

    const { id } = request.params as { id: string };
    return reply
      .status(httpStatus.OK)
      .send(await this.seasonService.finishSeason(id, request.user.buildingId));
  }

  public async deleteSeason(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (request.user.userType !== UserTypeEnum.ADMIN) {
      throw httpException(
        "Apenas administradores podem deletar seasons",
        httpStatus.FORBIDDEN
      );
    }

    const { id } = request.params as { id: string };
    return reply
      .status(httpStatus.OK)
      .send(await this.seasonService.deleteSeason(id, request.user.buildingId));
  }
}
