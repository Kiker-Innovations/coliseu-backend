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
import { getDate } from "@/v1/utils/utils"; // Needed to set createdAt, updatedAt

export class SeasonService {
  private seasonRepository: SeasonRepository;
  private residentSuggestionRepository: ResidentSuggestionRepository;

  constructor(mongoClient: MongoClient) {
    this.seasonRepository = new SeasonRepository(mongoClient);
    this.residentSuggestionRepository = new ResidentSuggestionRepository(
      mongoClient
    );
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
