import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import { httpException } from "../../../config/error";
import { transformCreateProjectOfferDto } from "./dto";
import { ProjectOfferService } from "./projectOffer.service";
import { UserTypeEnum } from "../../enum/userType.enum";

export class ProjectOfferController {
  private projectOfferService: ProjectOfferService;

  constructor(mongoClient: MongoClient) {
    this.projectOfferService = new ProjectOfferService(mongoClient);
  }

  public async createProjectOffers(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (request.user.userType !== UserTypeEnum.ADMIN) {
      throw httpException(
        "Apenas administradores podem cadastrar ofertas",
        httpStatus.FORBIDDEN
      );
    }

    return reply
      .code(httpStatus.CREATED)
      .send(
        await this.projectOfferService.createProjectOffers(
          transformCreateProjectOfferDto(request.body),
          request.user.buildingId,
          request.user.actualSeasonId
        )
      );
  }

  public async getAllOffersByProject(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { projectId } = request.params as { projectId: string };
    return reply
      .status(httpStatus.OK)
      .send(
        await this.projectOfferService.getAllOffersByProject(
          projectId,
          request.user.buildingId,
          request.user.actualSeasonId
        )
      );
  }

  public async getOfferById(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { id } = request.params as { id: string };
    return reply
      .status(httpStatus.OK)
      .send(
        await this.projectOfferService.getOfferById(id, request.user.buildingId)
      );
  }

  public async deleteOffersByProject(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (request.user.userType !== UserTypeEnum.ADMIN) {
      throw httpException(
        "Apenas administradores podem deletar ofertas",
        httpStatus.FORBIDDEN
      );
    }

    const { projectId } = request.params as { projectId: string };
    return reply
      .status(httpStatus.OK)
      .send(
        await this.projectOfferService.deleteOffersByProject(
          projectId,
          request.user.buildingId
        )
      );
  }

  public async voteOffer(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (request.user.userType !== UserTypeEnum.RESIDENT) {
      throw httpException(
        "Apenas moradores podem votar em ofertas",
        httpStatus.FORBIDDEN
      );
    }

    const { offerId } = request.body as { offerId: string };
    return reply
      .status(httpStatus.OK)
      .send(
        await this.projectOfferService.voteOffer(offerId, request.user.userId)
      );
  }

  public async getMyVote(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (request.user.userType !== UserTypeEnum.RESIDENT) {
      throw httpException(
        "Apenas moradores podem visualizar seus votos",
        httpStatus.FORBIDDEN
      );
    }

    const { projectId } = request.params as { projectId: string };
    return reply
      .status(httpStatus.OK)
      .send(
        await this.projectOfferService.getMyVote(projectId, request.user.userId)
      );
  }

  public async chooseWinningOffer(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (request.user.userType !== UserTypeEnum.ADMIN) {
      throw httpException(
        "Apenas administradores podem escolher a oferta vencedora",
        httpStatus.FORBIDDEN
      );
    }

    const { projectId } = request.params as { projectId: string };
    return reply
      .status(httpStatus.OK)
      .send(
        await this.projectOfferService.chooseWinningOffer(
          projectId,
          request.user.buildingId
        )
      );
  }
}
