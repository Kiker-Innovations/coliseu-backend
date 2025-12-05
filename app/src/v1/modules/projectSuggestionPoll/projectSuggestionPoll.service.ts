import type { MongoClient } from "mongodb";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";
import type { ProjectSuggestionPollEntity } from "../../../database/mongodb/entity/projectSuggestionPoll.entity";
import { ProjectSuggestionPollRepository } from "../../../database/mongodb/repositories/projectSuggestionPoll.repository";
import { ProjectSuggestionRepository } from "../../../database/mongodb/repositories/projectSuggestion.repository";
import { ResidentRepository } from "../../../database/mongodb/repositories/resident.repository";
import type { ProjectSuggestionPollVoteDto } from "./dto";
import { getDate } from "@/v1/utils/utils";

const MAX_VOTES_PER_RESIDENT = 3;

export class ProjectSuggestionPollService {
  private projectSuggestionPollRepository: ProjectSuggestionPollRepository;
  private projectSuggestionRepository: ProjectSuggestionRepository;
  private residentRepository: ResidentRepository;

  constructor(mongoClient: MongoClient) {
    this.projectSuggestionPollRepository = new ProjectSuggestionPollRepository(
      mongoClient
    );
    this.projectSuggestionRepository = new ProjectSuggestionRepository(
      mongoClient
    );
    this.residentRepository = new ResidentRepository(mongoClient);
  }

  public async vote(
    voteDto: ProjectSuggestionPollVoteDto,
    residentId: string
  ): Promise<
    HttpResponse<{
      id: string;
      projectSuggestionId: string;
      voteCount: number;
      createdAt: Date;
    }>
  > {
    const resident = await this.residentRepository.findById(residentId);
    if (!resident) {
      throw httpException("Morador não encontrado", httpStatus.NOT_FOUND);
    }

    const projectSuggestion = await this.projectSuggestionRepository.findById(
      voteDto.projectSuggestionId
    );
    if (!projectSuggestion) {
      throw httpException(
        "Sugestão de projeto não encontrada",
        httpStatus.NOT_FOUND
      );
    }

    if (projectSuggestion.buildingId !== resident.buildingId) {
      throw httpException(
        "Você não tem permissão para votar nesta sugestão de projeto",
        httpStatus.FORBIDDEN
      );
    }

    const now = getDate();
    if (
      !projectSuggestion.votingStartDate ||
      !projectSuggestion.votingEndDate
    ) {
      throw httpException(
        "O período de votação ainda não foi definido para esta sugestão",
        httpStatus.BAD_REQUEST
      );
    }

    if (now < projectSuggestion.votingStartDate) {
      throw httpException(
        "O período de votação ainda não começou",
        httpStatus.BAD_REQUEST
      );
    }

    if (now > projectSuggestion.votingEndDate) {
      throw httpException(
        "O período de votação já foi encerrado",
        httpStatus.BAD_REQUEST
      );
    }

    const allSuggestions =
      await this.projectSuggestionRepository.findManyByBuildingIdAndSeasonId(
        resident.buildingId,
        projectSuggestion.seasonId
      );
    const suggestionIds = allSuggestions.map((s) => s._id);

    const totalVotesUsed =
      await this.projectSuggestionPollRepository.sumVotesByResidentIdAndProjectSuggestionIds(
        residentId,
        suggestionIds
      );

    const existingVote =
      await this.projectSuggestionPollRepository.findByProjectSuggestionIdAndResidentId(
        voteDto.projectSuggestionId,
        residentId
      );

    const currentVotesOnThis = existingVote ? existingVote.voteCount : 0;
    const votesAvailable =
      MAX_VOTES_PER_RESIDENT - totalVotesUsed + currentVotesOnThis;

    if (voteDto.voteCount > votesAvailable) {
      throw httpException(
        `Você não possui votos suficientes. Votos disponíveis: ${votesAvailable}`,
        httpStatus.BAD_REQUEST
      );
    }

    if (existingVote) {
      const voteDifference = voteDto.voteCount - existingVote.voteCount;

      const updatedVote = await this.projectSuggestionPollRepository.update(
        existingVote._id,
        {
          voteCount: voteDto.voteCount,
        }
      );

      if (!updatedVote) {
        throw httpException(
          "Erro ao atualizar voto",
          httpStatus.INTERNAL_SERVER_ERROR
        );
      }

      if (voteDifference !== 0) {
        await this.projectSuggestionRepository.incrementVotes(
          voteDto.projectSuggestionId,
          voteDifference
        );
      }

      return {
        success: true,
        message: "Voto atualizado com sucesso",
        data: {
          id: updatedVote._id,
          projectSuggestionId: updatedVote.projectSuggestionId,
          voteCount: updatedVote.voteCount,
          createdAt: updatedVote.createdAt,
        },
      };
    }

    const newVote = await this.projectSuggestionPollRepository.create({
      projectSuggestionId: voteDto.projectSuggestionId,
      residentId,
      voteCount: voteDto.voteCount,
    });

    await this.projectSuggestionRepository.incrementVotes(
      voteDto.projectSuggestionId,
      voteDto.voteCount
    );

    return {
      success: true,
      message: "Voto registrado com sucesso",
      data: {
        id: newVote._id,
        projectSuggestionId: newVote.projectSuggestionId,
        voteCount: newVote.voteCount,
        createdAt: newVote.createdAt,
      },
    };
  }

  public async deleteVote(
    projectSuggestionId: string,
    residentId: string
  ): Promise<HttpResponse<null>> {
    const resident = await this.residentRepository.findById(residentId);
    if (!resident) {
      throw httpException("Morador não encontrado", httpStatus.NOT_FOUND);
    }

    const projectSuggestion = await this.projectSuggestionRepository.findById(
      projectSuggestionId
    );
    if (!projectSuggestion) {
      throw httpException(
        "Sugestão de projeto não encontrada",
        httpStatus.NOT_FOUND
      );
    }

    const now = getDate();
    if (
      !projectSuggestion.votingStartDate ||
      !projectSuggestion.votingEndDate
    ) {
      throw httpException(
        "O período de votação ainda não foi definido para esta sugestão",
        httpStatus.BAD_REQUEST
      );
    }

    if (
      now < projectSuggestion.votingStartDate ||
      now > projectSuggestion.votingEndDate
    ) {
      throw httpException(
        "Não é possível remover votos fora do período de votação",
        httpStatus.BAD_REQUEST
      );
    }

    const existingVote =
      await this.projectSuggestionPollRepository.findByProjectSuggestionIdAndResidentId(
        projectSuggestionId,
        residentId
      );

    if (!existingVote) {
      throw httpException(
        "Voto não encontrado. Você não votou nesta sugestão de projeto",
        httpStatus.NOT_FOUND
      );
    }

    const deleted = await this.projectSuggestionPollRepository.delete(
      existingVote._id
    );

    if (!deleted) {
      throw httpException(
        "Erro ao deletar voto",
        httpStatus.INTERNAL_SERVER_ERROR
      );
    }

    await this.projectSuggestionRepository.decrementVotes(
      projectSuggestionId,
      existingVote.voteCount
    );

    return {
      success: true,
      message: "Voto removido com sucesso",
      data: null,
    };
  }

  public async getMyVotes(
    seasonId: string,
    residentId: string
  ): Promise<
    HttpResponse<{
      totalVotesUsed: number;
      votesRemaining: number;
      votes: Array<{
        id: string;
        projectSuggestionId: string;
        voteCount: number;
        createdAt: Date;
      }>;
    }>
  > {
    const resident = await this.residentRepository.findById(residentId);
    if (!resident) {
      throw httpException("Morador não encontrado", httpStatus.NOT_FOUND);
    }

    const allSuggestions =
      await this.projectSuggestionRepository.findManyByBuildingIdAndSeasonId(
        resident.buildingId,
        seasonId
      );

    if (allSuggestions.length === 0) {
      return {
        success: true,
        message: "Nenhuma sugestão de projeto encontrada para esta temporada",
        data: {
          totalVotesUsed: 0,
          votesRemaining: MAX_VOTES_PER_RESIDENT,
          votes: [],
        },
      };
    }

    const suggestionIds = allSuggestions.map((s) => s._id);

    const myVotes =
      await this.projectSuggestionPollRepository.findManyByProjectSuggestionIds(
        suggestionIds
      );
    const myFilteredVotes = myVotes.filter((v) => v.residentId === residentId);

    const totalVotesUsed = myFilteredVotes.reduce(
      (sum, v) => sum + v.voteCount,
      0
    );

    return {
      success: true,
      message: "Votos encontrados com sucesso",
      data: {
        totalVotesUsed,
        votesRemaining: MAX_VOTES_PER_RESIDENT - totalVotesUsed,
        votes: myFilteredVotes.map((v) => ({
          id: v._id,
          projectSuggestionId: v.projectSuggestionId,
          voteCount: v.voteCount,
          createdAt: v.createdAt,
        })),
      },
    };
  }

  public async getMyVoteOnSuggestion(
    projectSuggestionId: string,
    residentId: string
  ): Promise<
    HttpResponse<{
      id: string;
      projectSuggestionId: string;
      voteCount: number;
      createdAt: Date;
      updatedAt: Date;
    } | null>
  > {
    const resident = await this.residentRepository.findById(residentId);
    if (!resident) {
      throw httpException("Morador não encontrado", httpStatus.NOT_FOUND);
    }

    const projectSuggestion = await this.projectSuggestionRepository.findById(
      projectSuggestionId
    );
    if (!projectSuggestion) {
      throw httpException(
        "Sugestão de projeto não encontrada",
        httpStatus.NOT_FOUND
      );
    }

    const vote =
      await this.projectSuggestionPollRepository.findByProjectSuggestionIdAndResidentId(
        projectSuggestionId,
        residentId
      );

    if (!vote) {
      return {
        success: true,
        message: "Você ainda não votou nesta sugestão de projeto",
        data: null,
      };
    }

    return {
      success: true,
      message: "Voto encontrado com sucesso",
      data: {
        id: vote._id,
        projectSuggestionId: vote.projectSuggestionId,
        voteCount: vote.voteCount,
        createdAt: vote.createdAt,
        updatedAt: vote.updatedAt,
      },
    };
  }
}
