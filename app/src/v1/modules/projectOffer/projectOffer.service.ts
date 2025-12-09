import type { MongoClient } from "mongodb";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";
import type {
  CreateProjectOfferEntity,
  ProjectOfferEntity,
} from "../../../database/mongodb/entity/projectOffer.entity";
import { ProjectOfferRepository } from "../../../database/mongodb/repositories/projectOffer.repository";
import { ProjectRepository } from "../../../database/mongodb/repositories/project.repository";
import { ProjectOfferVoteRepository } from "../../../database/mongodb/repositories/projectOfferVote.repository";
import { ResidentRepository } from "../../../database/mongodb/repositories/resident.repository";
import type { ProjectOfferCreateDto } from "./dto";
import { getDate } from "@/v1/utils/utils";

export class ProjectOfferService {
  private projectOfferRepository: ProjectOfferRepository;
  private projectRepository: ProjectRepository;
  private projectOfferVoteRepository: ProjectOfferVoteRepository;
  private residentRepository: ResidentRepository;

  constructor(mongoClient: MongoClient) {
    this.projectOfferRepository = new ProjectOfferRepository(mongoClient);
    this.projectRepository = new ProjectRepository(mongoClient);
    this.projectOfferVoteRepository = new ProjectOfferVoteRepository(
      mongoClient
    );
    this.residentRepository = new ResidentRepository(mongoClient);
  }

  public async createProjectOffers(
    projectOfferCreateDto: ProjectOfferCreateDto,
    buildingId: string,
    seasonId: string
  ): Promise<HttpResponse<ProjectOfferEntity[]>> {
    const project = await this.projectRepository.findById(
      projectOfferCreateDto.projectId
    );

    if (!project) {
      throw httpException("Projeto não encontrado", httpStatus.NOT_FOUND);
    }

    if (project.buildingId !== buildingId) {
      throw httpException(
        "Você não tem permissão para cadastrar ofertas neste projeto",
        httpStatus.FORBIDDEN
      );
    }

    const existingOffers =
      await this.projectOfferRepository.findManyByProjectId(
        projectOfferCreateDto.projectId
      );

    if (existingOffers.length > 0) {
      throw httpException(
        "Este projeto já possui ofertas cadastradas. Delete as ofertas existentes antes de cadastrar novas.",
        httpStatus.BAD_REQUEST
      );
    }

    const offerStartDate = new Date(projectOfferCreateDto.offerStartDate);
    const offerEndDate = new Date(projectOfferCreateDto.offerEndDate);

    if (offerStartDate >= offerEndDate) {
      throw httpException(
        "A data de início das ofertas deve ser anterior à data de término",
        httpStatus.BAD_REQUEST
      );
    }

    await this.projectRepository.update(projectOfferCreateDto.projectId, {
      offerStartDate,
      offerEndDate,
    });

    const offersToCreate: CreateProjectOfferEntity[] =
      projectOfferCreateDto.offers.map((offer) => ({
        buildingId,
        seasonId,
        projectId: projectOfferCreateDto.projectId,
        companyName: offer.companyName,
        description: offer.description,
        companyCnpj: offer.companyCnpj,
        totalValue: offer.totalValue,
        installmentsCount: offer.installmentsCount,
        votes: 0,
      }));

    const createdOffers = await this.projectOfferRepository.createMany(
      offersToCreate
    );

    return {
      success: true,
      message: "Ofertas cadastradas com sucesso!",
      data: createdOffers,
    };
  }

  public async getAllOffersByProject(
    projectId: string,
    buildingId: string,
    seasonId: string
  ): Promise<HttpResponse<ProjectOfferEntity[]>> {
    const project = await this.projectRepository.findById(projectId);

    if (!project) {
      throw httpException("Projeto não encontrado", httpStatus.NOT_FOUND);
    }

    if (project.buildingId !== buildingId) {
      throw httpException(
        "Você não tem permissão para acessar as ofertas deste projeto",
        httpStatus.FORBIDDEN
      );
    }

    const offers =
      await this.projectOfferRepository.findManyByBuildingSeasonAndProject(
        buildingId,
        seasonId,
        projectId
      );

    return {
      success: true,
      message: "Ofertas encontradas com sucesso",
      data: offers,
    };
  }

  public async getOfferById(
    offerId: string,
    buildingId: string
  ): Promise<HttpResponse<ProjectOfferEntity>> {
    const offer = await this.projectOfferRepository.findById(offerId);

    if (!offer) {
      throw httpException("Oferta não encontrada", httpStatus.NOT_FOUND);
    }

    if (offer.buildingId !== buildingId) {
      throw httpException(
        "Você não tem permissão para acessar esta oferta",
        httpStatus.FORBIDDEN
      );
    }

    return {
      success: true,
      message: "Oferta encontrada com sucesso",
      data: offer,
    };
  }

  public async deleteOffersByProject(
    projectId: string,
    buildingId: string
  ): Promise<HttpResponse<null>> {
    const project = await this.projectRepository.findById(projectId);

    if (!project) {
      throw httpException("Projeto não encontrado", httpStatus.NOT_FOUND);
    }

    if (project.buildingId !== buildingId) {
      throw httpException(
        "Você não tem permissão para deletar ofertas deste projeto",
        httpStatus.FORBIDDEN
      );
    }

    if (project.chosenOfferId) {
      throw httpException(
        "Não é possível deletar ofertas de um projeto que já possui oferta escolhida",
        httpStatus.BAD_REQUEST
      );
    }

    // Check if offer poll has ended
    if (project.offerEndDate) {
      const now = getDate();
      if (now > project.offerEndDate) {
        throw httpException(
          "Não é possível deletar ofertas após o encerramento da votação",
          httpStatus.BAD_REQUEST
        );
      }
    }

    await this.projectOfferRepository.deleteByProjectId(projectId);
    await this.projectOfferVoteRepository.deleteByProjectId(projectId);

    await this.projectRepository.update(projectId, {
      offerStartDate: undefined,
      offerEndDate: undefined,
    });

    return {
      success: true,
      message: "Ofertas deletadas com sucesso",
      data: null,
    };
  }

  public async voteOffer(
    offerId: string,
    residentId: string
  ): Promise<HttpResponse<{ voteId: string; offerId: string }>> {
    const resident = await this.residentRepository.findById(residentId);

    if (!resident) {
      throw httpException("Morador não encontrado", httpStatus.NOT_FOUND);
    }

    const offer = await this.projectOfferRepository.findById(offerId);

    if (!offer) {
      throw httpException("Oferta não encontrada", httpStatus.NOT_FOUND);
    }

    if (offer.buildingId !== resident.buildingId) {
      throw httpException(
        "Você não pode votar em ofertas de outro prédio",
        httpStatus.FORBIDDEN
      );
    }

    const project = await this.projectRepository.findById(offer.projectId);

    if (!project) {
      throw httpException("Projeto não encontrado", httpStatus.NOT_FOUND);
    }

    if (project.chosenOfferId) {
      throw httpException(
        "Este projeto já possui oferta escolhida",
        httpStatus.BAD_REQUEST
      );
    }

    // Check if offer poll is active
    const now = getDate();
    if (!project.offerStartDate || now < project.offerStartDate) {
      throw httpException(
        "O período de votação ainda não começou",
        httpStatus.BAD_REQUEST
      );
    }

    if (!project.offerEndDate || now > project.offerEndDate) {
      throw httpException(
        "O período de votação já encerrou",
        httpStatus.BAD_REQUEST
      );
    }

    // Check if apartment already voted for this project (1 vote per apartment)
    const existingVote =
      await this.projectOfferVoteRepository.findByProjectIdAndApartmentId(
        offer.projectId,
        resident.apartmentId
      );

    if (existingVote) {
      // Update vote to new offer
      if (existingVote.projectOfferId !== offerId) {
        // Decrement votes from old offer
        const oldOffer = await this.projectOfferRepository.findById(
          existingVote.projectOfferId
        );
        if (oldOffer && oldOffer.votes > 0) {
          await this.projectOfferRepository.update(
            existingVote.projectOfferId,
            {
              votes: oldOffer.votes - 1,
            }
          );
        }

        // Update vote record
        await this.projectOfferVoteRepository.update(existingVote._id, {
          projectOfferId: offerId,
        });

        // Increment votes for new offer
        await this.projectOfferRepository.incrementVotes(offerId);

        return {
          success: true,
          message: "Voto atualizado com sucesso",
          data: {
            voteId: existingVote._id,
            offerId,
          },
        };
      }

      return {
        success: true,
        message: "Você já votou nesta oferta",
        data: {
          voteId: existingVote._id,
          offerId,
        },
      };
    }

    // Create new vote
    const vote = await this.projectOfferVoteRepository.create({
      buildingId: resident.buildingId,
      seasonId: offer.seasonId,
      projectId: offer.projectId,
      projectOfferId: offerId,
      residentId,
      apartmentId: resident.apartmentId,
    });

    // Increment offer votes
    await this.projectOfferRepository.incrementVotes(offerId);

    return {
      success: true,
      message: "Voto registrado com sucesso",
      data: {
        voteId: vote._id,
        offerId,
      },
    };
  }

  public async getMyVote(
    projectId: string,
    residentId: string
  ): Promise<HttpResponse<{ offerId: string | null }>> {
    const resident = await this.residentRepository.findById(residentId);

    if (!resident) {
      throw httpException("Morador não encontrado", httpStatus.NOT_FOUND);
    }

    const project = await this.projectRepository.findById(projectId);

    if (!project) {
      throw httpException("Projeto não encontrado", httpStatus.NOT_FOUND);
    }

    if (project.buildingId !== resident.buildingId) {
      throw httpException(
        "Você não tem permissão para acessar este projeto",
        httpStatus.FORBIDDEN
      );
    }

    const vote =
      await this.projectOfferVoteRepository.findByProjectIdAndApartmentId(
        projectId,
        resident.apartmentId
      );

    return {
      success: true,
      message: vote ? "Voto encontrado" : "Nenhum voto encontrado",
      data: {
        offerId: vote?.projectOfferId || null,
      },
    };
  }

  public async chooseWinningOffer(
    projectId: string,
    buildingId: string
  ): Promise<HttpResponse<ProjectOfferEntity>> {
    const project = await this.projectRepository.findById(projectId);

    if (!project) {
      throw httpException("Projeto não encontrado", httpStatus.NOT_FOUND);
    }

    if (project.buildingId !== buildingId) {
      throw httpException(
        "Você não tem permissão para escolher oferta deste projeto",
        httpStatus.FORBIDDEN
      );
    }

    if (project.chosenOfferId) {
      throw httpException(
        "Este projeto já possui oferta escolhida",
        httpStatus.BAD_REQUEST
      );
    }

    // Check if offer poll has ended
    const now = getDate();
    if (!project.offerEndDate || now <= project.offerEndDate) {
      throw httpException(
        "Aguarde o término do período de votação para escolher a oferta vencedora",
        httpStatus.BAD_REQUEST
      );
    }

    // Get all offers sorted by votes
    const offers = await this.projectOfferRepository.findManyByProjectId(
      projectId
    );

    if (offers.length === 0) {
      throw httpException(
        "Este projeto não possui ofertas cadastradas",
        httpStatus.BAD_REQUEST
      );
    }

    // Get offer with most votes (already sorted by votes desc)
    const winningOffer = offers[0];

    // Update project with chosen offer
    await this.projectRepository.update(projectId, {
      chosenOfferId: winningOffer._id,
    });

    // Iniciar as parcelas da oferta vencedora
    // A primeira parcela começa automaticamente no mês da aprovação
    await this.projectOfferRepository.update(winningOffer._id, {
      paymentStartDate: now,
      paidInstallments: 0,
    });

    return {
      success: true,
      message:
        "Oferta vencedora escolhida com sucesso. O pagamento das parcelas foi iniciado.",
      data: {
        ...winningOffer,
        paymentStartDate: now,
        paidInstallments: 0,
      },
    };
  }
}
