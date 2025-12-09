import type { MongoClient } from "mongodb";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";
import type {
  CreateProjectEntity,
  ProjectEntity,
} from "../../../database/mongodb/entity/project.entity";
import type { ProjectOfferEntity } from "../../../database/mongodb/entity/projectOffer.entity";
import { ProjectRepository } from "../../../database/mongodb/repositories/project.repository";
import { ProjectOfferRepository } from "../../../database/mongodb/repositories/projectOffer.repository";
import type { ProjectCreateDto, ProjectUpdateDto } from "./dto";

export interface ProjectWithOfferResponse {
  title: string;
  description: string;
  votes: number;
  rank?: number;
  offer: {
    companyName: string;
    description: string;
    companyCnpj: string;
    totalValue: number;
    installmentsCount: number;
    paidInstallments?: number;
    votes: number;
    paymentStartDate?: Date;
  };
}

export class ProjectService {
  private projectRepository: ProjectRepository;
  private projectOfferRepository: ProjectOfferRepository;

  constructor(mongoClient: MongoClient) {
    this.projectRepository = new ProjectRepository(mongoClient);
    this.projectOfferRepository = new ProjectOfferRepository(mongoClient);
  }

  public async createProject(
    projectCreateDto: ProjectCreateDto,
    buildingId: string,
    fromSeasonId: string
  ): Promise<HttpResponse<ProjectEntity>> {
    const projectEntity: CreateProjectEntity = {
      buildingId,
      fromSeasonId,
      title: projectCreateDto.title,
      description: projectCreateDto.description,
      votes: 0,
    };

    const createdProject = await this.projectRepository.create(projectEntity);

    return {
      success: true,
      message: "Projeto cadastrado com sucesso!",
      data: createdProject,
    };
  }

  public async getAllProjectsByBuildingAndSeason(
    buildingId: string,
    fromSeasonId: string
  ): Promise<HttpResponse<ProjectEntity[]>> {
    const projects =
      await this.projectRepository.findManyByBuildingIdAndSeasonId(
        buildingId,
        fromSeasonId
      );	  

    const projectsWithOffers = await Promise.all(
      projects.map(async (project) => {
        if (project?.chosenOfferId && project.chosenOfferId !== null) {
          const offer = await this.projectOfferRepository.findById(
            project.chosenOfferId
          );
          return {
            ...project,
            offer,
          };
        }
        return { ...project, offer: {} };
      })
    );

    return {
      success: true,
      message: "Projetos encontrados com sucesso",
      data: projectsWithOffers.filter((project) => project !== undefined),
    };
  }

  public async getProjectById(
    projectId: string,
    buildingId: string
  ): Promise<HttpResponse<ProjectEntity>> {
    const project = await this.projectRepository.findById(projectId);

    if (!project) {
      throw httpException("Projeto não encontrado", httpStatus.NOT_FOUND);
    }

    if (project.buildingId !== buildingId) {
      throw httpException(
        "Você não tem permissão para acessar este projeto",
        httpStatus.FORBIDDEN
      );
    }

    return {
      success: true,
      message: "Projeto encontrado com sucesso",
      data: project,
    };
  }

  public async getProjectsWithPendingPayments(
    buildingId: string
  ): Promise<HttpResponse<ProjectWithOfferResponse[]>> {
    const projectsWithChosenOffer =
      await this.projectRepository.findManyWithChosenOfferByBuildingId(
        buildingId
      );

    if (projectsWithChosenOffer.length === 0) {
      return {
        success: true,
        message: "Nenhum projeto com oferta escolhida encontrado",
        data: [],
      };
    }

    const chosenOfferIds = projectsWithChosenOffer
      .map((project) => project.chosenOfferId)
      .filter((id): id is string => id !== undefined);

    const offersWithPendingPayments =
      await this.projectOfferRepository.findPendingPaymentsByOfferIds(
        chosenOfferIds
      );

    const offerMap = new Map<string, ProjectOfferEntity>();
    for (const offer of offersWithPendingPayments) {
      offerMap.set(offer._id, offer);
    }

    const result: ProjectWithOfferResponse[] = [];

    for (const project of projectsWithChosenOffer) {
      if (project.chosenOfferId && offerMap.has(project.chosenOfferId)) {
        const offer = offerMap.get(project.chosenOfferId)!;
        result.push({
          title: project.title,
          description: project.description,
          votes: project.votes,
          rank: project.rank,
          offer: {
            companyName: offer.companyName,
            description: offer.description,
            companyCnpj: offer.companyCnpj,
            totalValue: offer.totalValue,
            installmentsCount: offer.installmentsCount,
            paidInstallments: offer.paidInstallments,
            votes: offer.votes,
            paymentStartDate: offer.paymentStartDate,
          },
        });
      }
    }

    return {
      success: true,
      message: "Projetos com pagamentos pendentes encontrados com sucesso",
      data: result,
    };
  }

  public async updateProject(
    projectId: string,
    projectUpdateDto: ProjectUpdateDto,
    buildingId: string
  ): Promise<HttpResponse<ProjectEntity>> {
    const project = await this.projectRepository.findById(projectId);

    if (!project) {
      throw httpException("Projeto não encontrado", httpStatus.NOT_FOUND);
    }

    if (project.buildingId !== buildingId) {
      throw httpException(
        "Você não tem permissão para atualizar este projeto",
        httpStatus.FORBIDDEN
      );
    }

    const updatedProject = await this.projectRepository.update(
      projectId,
      projectUpdateDto
    );

    if (!updatedProject) {
      throw httpException(
        "Erro ao atualizar projeto",
        httpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return {
      success: true,
      message: "Projeto atualizado com sucesso",
      data: updatedProject,
    };
  }

  public async deleteProject(
    projectId: string,
    buildingId: string
  ): Promise<HttpResponse<null>> {
    const project = await this.projectRepository.findById(projectId);

    if (!project) {
      throw httpException("Projeto não encontrado", httpStatus.NOT_FOUND);
    }

    if (project.buildingId !== buildingId) {
      throw httpException(
        "Você não tem permissão para deletar este projeto",
        httpStatus.FORBIDDEN
      );
    }

    await this.projectOfferRepository.deleteByProjectId(projectId);

    const deleted = await this.projectRepository.delete(projectId);

    if (!deleted) {
      throw httpException(
        "Erro ao deletar projeto",
        httpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return {
      success: true,
      message: "Projeto deletado com sucesso",
      data: null,
    };
  }
}
