import type { MongoClient } from "mongodb";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";
import type {
  CreateSeasonEntity,
  SeasonEntity,
} from "../../../database/mongodb/entity/season.entity";
import { SeasonRepository } from "../../../database/mongodb/repositories/season.repository";
import type { SeasonCreateDto, SeasonUpdateDto } from "./dto";

import type {
  CreateResidentSuggestionEntity,
  ResidentSuggestionEntity,
} from "../../../database/mongodb/entity/residentSuggestion.entity";
import { ResidentSuggestionRepository } from "../../../database/mongodb/repositories/residentSuggestion.repository";
import type {
  CreateProjectSuggestionEntity,
  ProjectSuggestionEntity,
} from "../../../database/mongodb/entity/projectSuggestion.entity";
import { ProjectSuggestionRepository } from "../../../database/mongodb/repositories/projectSuggestion.repository";
import { ProjectSuggestionPollRepository } from "../../../database/mongodb/repositories/projectSuggestionPoll.repository";
import type {
  CreateProjectEntity,
  ProjectEntity,
} from "../../../database/mongodb/entity/project.entity";
import { ProjectRepository } from "../../../database/mongodb/repositories/project.repository";

interface RankedSuggestion {
  title: string;
  description: string;
  duplicateCount: number;
  rank: number;
  apartmentIds: string[];
}

export class SeasonService {
  private seasonRepository: SeasonRepository;
  private residentSuggestionRepository: ResidentSuggestionRepository;
  private projectSuggestionRepository: ProjectSuggestionRepository;
  private projectSuggestionPollRepository: ProjectSuggestionPollRepository;
  private projectRepository: ProjectRepository;

  constructor(mongoClient: MongoClient) {
    this.seasonRepository = new SeasonRepository(mongoClient);
    this.residentSuggestionRepository = new ResidentSuggestionRepository(
      mongoClient
    );
    this.projectSuggestionRepository = new ProjectSuggestionRepository(
      mongoClient
    );
    this.projectSuggestionPollRepository = new ProjectSuggestionPollRepository(
      mongoClient
    );
    this.projectRepository = new ProjectRepository(mongoClient);
  }

  public async createSeason(
    seasonCreateDto: SeasonCreateDto,
    buildingId: string
  ): Promise<HttpResponse<SeasonEntity>> {
    const openSeasonsCount =
      await this.seasonRepository.countOpenSeasonsByBuildingId(buildingId);

    if (openSeasonsCount > 0) {
      throw httpException(
        "Não é possível criar uma nova temporada enquanto houver temporadas em aberto",
        httpStatus.BAD_REQUEST
      );
    }

    const seasonEntity: CreateSeasonEntity = {
      buildingId,
      reusedSuggestions: seasonCreateDto.reusedSuggestions,
    };

    const createdSeason = await this.seasonRepository.create(seasonEntity);

    if (seasonCreateDto.reusedSuggestions) {
      await this.duplicatePreviousSeasonSuggestions(buildingId, createdSeason);
    }

    return {
      success: true,
      message: "Season cadastrada com sucesso!",
      data: createdSeason,
    };
  }

  private async duplicatePreviousSeasonSuggestions(
    buildingId: string,
    createdSeason: SeasonEntity
  ): Promise<void> {
    const previousSeasonNumber = createdSeason.seasonNumber - 1;
    let previousSeason = null;
    if (previousSeasonNumber > 0) {
      previousSeason =
        await this.seasonRepository.findByBuildingIdAndSeasonNumber(
          buildingId,
          previousSeasonNumber
        );
    }

    if (previousSeason) {
      const previousSuggestions: ResidentSuggestionEntity[] =
        await this.residentSuggestionRepository.findMany({
          actualSeasonId: previousSeason._id,
          buildingId: buildingId,
        });

      const duplicatedSuggestions: CreateResidentSuggestionEntity[] =
        previousSuggestions.map((s) => ({
          apartmentId: s.apartmentId,
          buildingId: s.buildingId,
          fromSeasonId: previousSeason._id,
          actualSeasonId: createdSeason._id,
          title: s.title,
          description: s.description,
        }));

      await Promise.all(
        duplicatedSuggestions.map((data) =>
          this.residentSuggestionRepository.create(data)
        )
      );
    }
  }

  public async getAllSeasonsByBuilding(
    buildingId: string
  ): Promise<HttpResponse<SeasonEntity[]>> {
    const seasons = await this.seasonRepository.findManyByBuildingId(
      buildingId
    );

    return {
      success: true,
      message: "Seasons encontradas com sucesso",
      data: seasons,
    };
  }

  public async getSeasonById(
    seasonId: string,
    buildingId: string
  ): Promise<HttpResponse<SeasonEntity>> {
    const season = await this.seasonRepository.findById(seasonId);

    if (!season) {
      throw httpException("Season não encontrada", httpStatus.NOT_FOUND);
    }

    if (season.buildingId !== buildingId) {
      throw httpException(
        "Você não tem permissão para acessar esta season",
        httpStatus.FORBIDDEN
      );
    }

    return {
      success: true,
      message: "Season encontrada com sucesso",
      data: season,
    };
  }

  public async updateSeason(
    seasonId: string,
    seasonUpdateDto: SeasonUpdateDto,
    buildingId: string
  ): Promise<HttpResponse<SeasonEntity>> {
    const season = await this.seasonRepository.findById(seasonId);

    if (!season) {
      throw httpException("Season não encontrada", httpStatus.NOT_FOUND);
    }

    if (season.buildingId !== buildingId) {
      throw httpException(
        "Você não tem permissão para atualizar esta season",
        httpStatus.FORBIDDEN
      );
    }

    if (season.endDate !== null) {
      throw httpException(
        "Não é possível atualizar uma season finalizada",
        httpStatus.BAD_REQUEST
      );
    }

    const updatedSeason = await this.seasonRepository.update(
      seasonId,
      seasonUpdateDto
    );

    if (!updatedSeason) {
      throw httpException(
        "Erro ao atualizar season",
        httpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return {
      success: true,
      message: "Season atualizada com sucesso",
      data: updatedSeason,
    };
  }

  public async finishSeason(
    seasonId: string,
    buildingId: string
  ): Promise<HttpResponse<SeasonEntity>> {
    const season = await this.seasonRepository.findById(seasonId);

    if (!season) {
      throw httpException("Season não encontrada", httpStatus.NOT_FOUND);
    }

    if (season.buildingId !== buildingId) {
      throw httpException(
        "Você não tem permissão para finalizar esta season",
        httpStatus.FORBIDDEN
      );
    }

    if (season.endDate !== null) {
      throw httpException(
        "Esta season já foi finalizada",
        httpStatus.BAD_REQUEST
      );
    }

    const finishedSeason = await this.seasonRepository.finish(seasonId);

    if (!finishedSeason) {
      throw httpException(
        "Erro ao finalizar season",
        httpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return {
      success: true,
      message: "Season finalizada com sucesso",
      data: finishedSeason,
    };
  }

  private normalizeSuggestionText(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/g, "")
      .trim()
      .replace(/\s+/g, " ");
  }

  private areSuggestionsSimilar(
    title1: string,
    description1: string,
    title2: string,
    description2: string
  ): boolean {
    const normalizedTitle1 = this.normalizeSuggestionText(title1);
    const normalizedTitle2 = this.normalizeSuggestionText(title2);
    const normalizedDesc1 = this.normalizeSuggestionText(description1);
    const normalizedDesc2 = this.normalizeSuggestionText(description2);

    if (normalizedTitle1 === normalizedTitle2) {
      return true;
    }

    const words1 = new Set(
      normalizedTitle1.split(" ").filter((w) => w.length > 3)
    );
    const words2 = new Set(
      normalizedTitle2.split(" ").filter((w) => w.length > 3)
    );

    if (words1.size === 0 || words2.size === 0) {
      return false;
    }

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    const titleSimilarity = intersection.size / union.size;

    if (titleSimilarity >= 0.6) {
      return true;
    }

    const descWords1 = new Set(
      normalizedDesc1.split(" ").filter((w) => w.length > 3)
    );
    const descWords2 = new Set(
      normalizedDesc2.split(" ").filter((w) => w.length > 3)
    );

    if (descWords1.size === 0 || descWords2.size === 0) {
      return false;
    }

    const descIntersection = new Set(
      [...descWords1].filter((x) => descWords2.has(x))
    );
    const descUnion = new Set([...descWords1, ...descWords2]);

    const descSimilarity = descIntersection.size / descUnion.size;

    return titleSimilarity >= 0.4 && descSimilarity >= 0.5;
  }

  public async rankSuggestions(
    seasonId: string,
    buildingId: string
  ): Promise<HttpResponse<ProjectSuggestionEntity[]>> {
    const season = await this.seasonRepository.findById(seasonId);

    if (!season) {
      throw httpException("Season não encontrada", httpStatus.NOT_FOUND);
    }

    if (season.buildingId !== buildingId) {
      throw httpException(
        "Você não tem permissão para processar sugestões desta season",
        httpStatus.FORBIDDEN
      );
    }

    const existingProjectSuggestions =
      await this.projectSuggestionRepository.findManyByBuildingIdAndSeasonId(
        buildingId,
        seasonId
      );

    if (existingProjectSuggestions.length > 0) {
      const suggestionIds = existingProjectSuggestions.map((s) => s._id);
      await this.projectSuggestionPollRepository.deleteByProjectSuggestionIds(
        suggestionIds
      );
      await this.projectSuggestionRepository.deleteBySeasonId(seasonId);
    }

    const allSuggestions = await this.residentSuggestionRepository.findMany({
      buildingId,
      actualSeasonId: seasonId,
    });

    if (allSuggestions.length === 0) {
      throw httpException(
        "Nenhuma sugestão encontrada para esta temporada",
        httpStatus.BAD_REQUEST
      );
    }

    const suggestionsByApartment = new Map<
      string,
      ResidentSuggestionEntity[]
    >();
    for (const suggestion of allSuggestions) {
      const apartmentSuggestions =
        suggestionsByApartment.get(suggestion.apartmentId) || [];
      apartmentSuggestions.push(suggestion);
      suggestionsByApartment.set(suggestion.apartmentId, apartmentSuggestions);
    }

    const uniqueSuggestionsByApartment = new Map<
      string,
      ResidentSuggestionEntity[]
    >();

    for (const [apartmentId, suggestions] of suggestionsByApartment) {
      const sortedSuggestions = suggestions.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      const uniqueSuggestions: ResidentSuggestionEntity[] = [];

      for (const suggestion of sortedSuggestions) {
        const isDuplicate = uniqueSuggestions.some((unique) =>
          this.areSuggestionsSimilar(
            unique.title,
            unique.description,
            suggestion.title,
            suggestion.description
          )
        );

        if (!isDuplicate) {
          uniqueSuggestions.push(suggestion);
        }
      }

      uniqueSuggestionsByApartment.set(apartmentId, uniqueSuggestions);
    }

    const rankedSuggestions: RankedSuggestion[] = [];

    for (const [apartmentId, suggestions] of uniqueSuggestionsByApartment) {
      for (const suggestion of suggestions) {
        const existingIndex = rankedSuggestions.findIndex((ranked) =>
          this.areSuggestionsSimilar(
            ranked.title,
            ranked.description,
            suggestion.title,
            suggestion.description
          )
        );

        if (existingIndex >= 0) {
          if (
            !rankedSuggestions[existingIndex].apartmentIds.includes(apartmentId)
          ) {
            rankedSuggestions[existingIndex].duplicateCount += 1;
            rankedSuggestions[existingIndex].apartmentIds.push(apartmentId);
          }
        } else {
          rankedSuggestions.push({
            title: suggestion.title,
            description: suggestion.description,
            duplicateCount: 1,
            rank: 0,
            apartmentIds: [apartmentId],
          });
        }
      }
    }

    rankedSuggestions.sort((a, b) => b.duplicateCount - a.duplicateCount);

    rankedSuggestions.forEach((suggestion, index) => {
      suggestion.rank = index + 1;
    });

    const projectSuggestionsToCreate: CreateProjectSuggestionEntity[] =
      rankedSuggestions.map((ranked) => ({
        buildingId,
        seasonId,
        title: ranked.title,
        description: ranked.description,
        duplicateCount: ranked.duplicateCount,
        rank: ranked.rank,
      }));

    const createdProjectSuggestions =
      await this.projectSuggestionRepository.createMany(
        projectSuggestionsToCreate
      );

    return {
      success: true,
      message: `${createdProjectSuggestions.length} sugestões de projeto criadas com sucesso`,
      data: createdProjectSuggestions,
    };
  }

  public async promoteToProjects(
    seasonId: string,
    buildingId: string,
    topCount: number = 3
  ): Promise<HttpResponse<ProjectEntity[]>> {
    const season = await this.seasonRepository.findById(seasonId);

    if (!season) {
      throw httpException("Season não encontrada", httpStatus.NOT_FOUND);
    }

    if (season.buildingId !== buildingId) {
      throw httpException(
        "Você não tem permissão para promover projetos desta season",
        httpStatus.FORBIDDEN
      );
    }

    const projectSuggestions =
      await this.projectSuggestionRepository.findManyBySeasonIdOrderedByVotes(
        seasonId
      );

    if (projectSuggestions.length === 0) {
      throw httpException(
        "Nenhuma sugestão de projeto encontrada. Execute o rankSuggestions primeiro.",
        httpStatus.BAD_REQUEST
      );
    }

    const hasVotingPeriod = projectSuggestions.some(
      (s) => s.votingStartDate && s.votingEndDate
    );

    if (!hasVotingPeriod) {
      throw httpException(
        "O período de votação ainda não foi definido. Inicie a votação antes de promover projetos.",
        httpStatus.BAD_REQUEST
      );
    }

    const topSuggestions = projectSuggestions.slice(0, topCount);

    const createdProjects: ProjectEntity[] = [];

    for (let i = 0; i < topSuggestions.length; i++) {
      const suggestion = topSuggestions[i];

      const existingProject = await this.projectRepository.findOne({
        buildingId,
        fromSeasonId: seasonId,
        title: suggestion.title,
      });

      if (existingProject) {
        createdProjects.push(existingProject);
        continue;
      }

      const projectData: CreateProjectEntity = {
        buildingId,
        fromSeasonId: seasonId,
        title: suggestion.title,
        description: suggestion.description,
        votes: suggestion.votes,
      };

      const createdProject = await this.projectRepository.create(projectData);

      const updatedProject = await this.projectRepository.update(
        createdProject._id,
        {}
      );
      if (updatedProject) {
        createdProjects.push(updatedProject);
      } else {
        createdProjects.push(createdProject);
      }
    }

    return {
      success: true,
      message: `${createdProjects.length} projetos criados com sucesso`,
      data: createdProjects,
    };
  }

  public async deleteSeason(
    seasonId: string,
    buildingId: string
  ): Promise<HttpResponse<null>> {
    const season = await this.seasonRepository.findById(seasonId);

    if (!season) {
      throw httpException("Season não encontrada", httpStatus.NOT_FOUND);
    }

    if (season.buildingId !== buildingId) {
      throw httpException(
        "Você não tem permissão para deletar esta season",
        httpStatus.FORBIDDEN
      );
    }

    const projectSuggestions =
      await this.projectSuggestionRepository.findManyByBuildingIdAndSeasonId(
        buildingId,
        seasonId
      );

    if (projectSuggestions.length > 0) {
      const suggestionIds = projectSuggestions.map((s) => s._id);
      await this.projectSuggestionPollRepository.deleteByProjectSuggestionIds(
        suggestionIds
      );
      await this.projectSuggestionRepository.deleteBySeasonId(seasonId);
    }

    const deleted = await this.seasonRepository.delete(seasonId);

    if (!deleted) {
      throw httpException(
        "Erro ao deletar season",
        httpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return {
      success: true,
      message: "Season deletada com sucesso",
      data: null,
    };
  }
}
