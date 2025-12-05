import type { MongoClient } from "mongodb";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";
import type {
  CreateProjectSuggestionEntity,
  ProjectSuggestionEntity,
} from "../../../database/mongodb/entity/projectSuggestion.entity";
import { ProjectSuggestionRepository } from "../../../database/mongodb/repositories/projectSuggestion.repository";
import { SeasonRepository } from "../../../database/mongodb/repositories/season.repository";
import type {
  ProjectSuggestionUpdateDto,
  ProjectSuggestionStartVotingDto,
} from "./dto";
import { getDate, toDate } from "@/v1/utils/utils";

export class ProjectSuggestionService {
  private projectSuggestionRepository: ProjectSuggestionRepository;
  private seasonRepository: SeasonRepository;

  constructor(mongoClient: MongoClient) {
    this.projectSuggestionRepository = new ProjectSuggestionRepository(
      mongoClient
    );
    this.seasonRepository = new SeasonRepository(mongoClient);
  }

  public async getAllByBuildingAndSeason(
    buildingId: string,
    seasonId: string
  ): Promise<HttpResponse<ProjectSuggestionEntity[]>> {
    const season = await this.seasonRepository.findById(seasonId);

    if (!season) {
      throw httpException("Temporada não encontrada", httpStatus.NOT_FOUND);
    }

    if (season.buildingId !== buildingId) {
      throw httpException(
        "Você não tem permissão para acessar esta temporada",
        httpStatus.FORBIDDEN
      );
    }

    const projectSuggestions =
      await this.projectSuggestionRepository.findManyByBuildingIdAndSeasonId(
        buildingId,
        seasonId
      );

    return {
      success: true,
      message: "Sugestões de projeto encontradas com sucesso",
      data: projectSuggestions,
    };
  }

  public async getById(
    projectSuggestionId: string,
    buildingId: string
  ): Promise<HttpResponse<ProjectSuggestionEntity>> {
    const projectSuggestion = await this.projectSuggestionRepository.findById(
      projectSuggestionId
    );

    if (!projectSuggestion) {
      throw httpException(
        "Sugestão de projeto não encontrada",
        httpStatus.NOT_FOUND
      );
    }

    if (projectSuggestion.buildingId !== buildingId) {
      throw httpException(
        "Você não tem permissão para acessar esta sugestão de projeto",
        httpStatus.FORBIDDEN
      );
    }

    return {
      success: true,
      message: "Sugestão de projeto encontrada com sucesso",
      data: projectSuggestion,
    };
  }

  public async update(
    projectSuggestionId: string,
    projectSuggestionUpdateDto: ProjectSuggestionUpdateDto,
    buildingId: string
  ): Promise<HttpResponse<ProjectSuggestionEntity>> {
    const projectSuggestion = await this.projectSuggestionRepository.findById(
      projectSuggestionId
    );

    if (!projectSuggestion) {
      throw httpException(
        "Sugestão de projeto não encontrada",
        httpStatus.NOT_FOUND
      );
    }

    if (projectSuggestion.buildingId !== buildingId) {
      throw httpException(
        "Você não tem permissão para atualizar esta sugestão de projeto",
        httpStatus.FORBIDDEN
      );
    }

    if (
      projectSuggestion.votingStartDate &&
      getDate() >= projectSuggestion.votingStartDate
    ) {
      throw httpException(
        "Não é possível atualizar uma sugestão após o início da votação",
        httpStatus.BAD_REQUEST
      );
    }

    const updatedProjectSuggestion =
      await this.projectSuggestionRepository.update(
        projectSuggestionId,
        projectSuggestionUpdateDto
      );

    if (!updatedProjectSuggestion) {
      throw httpException(
        "Erro ao atualizar sugestão de projeto",
        httpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return {
      success: true,
      message: "Sugestão de projeto atualizada com sucesso",
      data: updatedProjectSuggestion,
    };
  }

  public async startVoting(
    seasonId: string,
    startVotingDto: ProjectSuggestionStartVotingDto,
    buildingId: string
  ): Promise<HttpResponse<ProjectSuggestionEntity[]>> {
    const season = await this.seasonRepository.findById(seasonId);

    if (!season) {
      throw httpException("Temporada não encontrada", httpStatus.NOT_FOUND);
    }

    if (season.buildingId !== buildingId) {
      throw httpException(
        "Você não tem permissão para iniciar votação nesta temporada",
        httpStatus.FORBIDDEN
      );
    }

    const projectSuggestions =
      await this.projectSuggestionRepository.findManyByBuildingIdAndSeasonId(
        buildingId,
        seasonId
      );

    if (projectSuggestions.length === 0) {
      throw httpException(
        "Nenhuma sugestão de projeto encontrada para esta temporada. Execute o rankSuggestions primeiro.",
        httpStatus.BAD_REQUEST
      );
    }

    const votingStartDate = toDate(startVotingDto.votingStartDate).toDate();
    const votingEndDate = toDate(startVotingDto.votingEndDate).toDate();

    if (votingEndDate <= votingStartDate) {
      throw httpException(
        "A data de fim da votação deve ser posterior à data de início",
        httpStatus.BAD_REQUEST
      );
    }

    const updatedSuggestions = await Promise.all(
      projectSuggestions.map((suggestion) =>
        this.projectSuggestionRepository.update(suggestion._id, {
          votingStartDate,
          votingEndDate,
        })
      )
    );

    return {
      success: true,
      message: "Período de votação definido com sucesso",
      data: updatedSuggestions.filter(
        (s): s is ProjectSuggestionEntity => s !== null
      ),
    };
  }

  public async delete(
    projectSuggestionId: string,
    buildingId: string
  ): Promise<HttpResponse<null>> {
    const projectSuggestion = await this.projectSuggestionRepository.findById(
      projectSuggestionId
    );

    if (!projectSuggestion) {
      throw httpException(
        "Sugestão de projeto não encontrada",
        httpStatus.NOT_FOUND
      );
    }

    if (projectSuggestion.buildingId !== buildingId) {
      throw httpException(
        "Você não tem permissão para deletar esta sugestão de projeto",
        httpStatus.FORBIDDEN
      );
    }

    const deleted = await this.projectSuggestionRepository.delete(
      projectSuggestionId
    );

    if (!deleted) {
      throw httpException(
        "Erro ao deletar sugestão de projeto",
        httpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return {
      success: true,
      message: "Sugestão de projeto deletada com sucesso",
      data: null,
    };
  }
}
