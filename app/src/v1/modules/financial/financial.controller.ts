import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import { httpException } from "../../../config/error";
import {
  transformFinancialCreateDto,
  transformRecurringExpenseCreateDto,
  transformRecurringExpenseUpdateDto,
  transformOneTimeExpenseCreateDto,
  transformOneTimeExpenseUpdateDto,
} from "./dto";
import { FinancialService } from "./financial.service";
import { UserTypeEnum } from "../../enum/userType.enum";

export class FinancialController {
  private financialService: FinancialService;

  constructor(mongoClient: MongoClient) {
    this.financialService = new FinancialService(mongoClient);
  }

  /**
   * Verifica se o mês virou e atualiza as parcelas
   * Esta rota deve ser chamada ao entrar nas telas financeiras
   */
  public async checkMonth(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    return reply
      .status(httpStatus.OK)
      .send(
        await this.financialService.checkAndUpdateMonth(request.user.buildingId)
      );
  }

  /**
   * Obtém o resumo financeiro do mês atual
   */
  public async getSummary(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    return reply
      .status(httpStatus.OK)
      .send(
        await this.financialService.getFinancialSummary(request.user.buildingId)
      );
  }

  /**
   * Adiciona uma entrada de caixa do condomínio
   */
  public async addFundEntry(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (request.user.userType !== UserTypeEnum.ADMIN) {
      throw httpException(
        "Apenas administradores podem cadastrar entradas de caixa",
        httpStatus.FORBIDDEN
      );
    }

    return reply
      .status(httpStatus.CREATED)
      .send(
        await this.financialService.addFundEntry(
          transformFinancialCreateDto(request.body),
          request.user.buildingId
        )
      );
  }

  /**
   * Adiciona uma despesa recorrente
   */
  public async addRecurringExpense(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (request.user.userType !== UserTypeEnum.ADMIN) {
      throw httpException(
        "Apenas administradores podem adicionar despesas recorrentes",
        httpStatus.FORBIDDEN
      );
    }

    return reply
      .status(httpStatus.CREATED)
      .send(
        await this.financialService.addRecurringExpense(
          transformRecurringExpenseCreateDto(request.body),
          request.user.buildingId
        )
      );
  }

  /**
   * Atualiza uma despesa recorrente
   */
  public async updateRecurringExpense(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (request.user.userType !== UserTypeEnum.ADMIN) {
      throw httpException(
        "Apenas administradores podem atualizar despesas recorrentes",
        httpStatus.FORBIDDEN
      );
    }

    const { id } = request.params as { id: string };
    return reply
      .status(httpStatus.OK)
      .send(
        await this.financialService.updateRecurringExpense(
          id,
          transformRecurringExpenseUpdateDto(request.body),
          request.user.buildingId
        )
      );
  }

  /**
   * Remove uma despesa recorrente
   */
  public async removeRecurringExpense(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (request.user.userType !== UserTypeEnum.ADMIN) {
      throw httpException(
        "Apenas administradores podem remover despesas recorrentes",
        httpStatus.FORBIDDEN
      );
    }

    const { id } = request.params as { id: string };
    return reply
      .status(httpStatus.OK)
      .send(
        await this.financialService.removeRecurringExpense(
          id,
          request.user.buildingId
        )
      );
  }

  /**
   * Adiciona uma despesa avulsa
   */
  public async addOneTimeExpense(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (request.user.userType !== UserTypeEnum.ADMIN) {
      throw httpException(
        "Apenas administradores podem adicionar despesas avulsas",
        httpStatus.FORBIDDEN
      );
    }

    return reply
      .status(httpStatus.CREATED)
      .send(
        await this.financialService.addOneTimeExpense(
          transformOneTimeExpenseCreateDto(request.body),
          request.user.buildingId
        )
      );
  }

  /**
   * Atualiza uma despesa avulsa
   */
  public async updateOneTimeExpense(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (request.user.userType !== UserTypeEnum.ADMIN) {
      throw httpException(
        "Apenas administradores podem atualizar despesas avulsas",
        httpStatus.FORBIDDEN
      );
    }

    const { id } = request.params as { id: string };
    return reply
      .status(httpStatus.OK)
      .send(
        await this.financialService.updateOneTimeExpense(
          id,
          transformOneTimeExpenseUpdateDto(request.body),
          request.user.buildingId
        )
      );
  }

  /**
   * Remove uma despesa avulsa
   */
  public async removeOneTimeExpense(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (request.user.userType !== UserTypeEnum.ADMIN) {
      throw httpException(
        "Apenas administradores podem remover despesas avulsas",
        httpStatus.FORBIDDEN
      );
    }

    const { id } = request.params as { id: string };
    return reply
      .status(httpStatus.OK)
      .send(
        await this.financialService.removeOneTimeExpense(
          id,
          request.user.buildingId
        )
      );
  }

  /**
   * Obtém histórico de snapshots
   */
  public async getSnapshots(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    return reply
      .status(httpStatus.OK)
      .send(await this.financialService.getSnapshots(request.user.buildingId));
  }

  /**
   * Obtém um snapshot específico por mês
   */
  public async getSnapshotByMonth(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { month } = request.params as { month: string };
    return reply
      .status(httpStatus.OK)
      .send(
        await this.financialService.getSnapshotByMonth(
          request.user.buildingId,
          month
        )
      );
  }

  /**
   * Obtém projetos em andamento (para dashboards e progresso)
   */
  public async getProjectsProgress(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    return reply
      .status(httpStatus.OK)
      .send(
        await this.financialService.getProjectsProgress(request.user.buildingId)
      );
  }
}
