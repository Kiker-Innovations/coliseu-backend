import { randomUUID } from "node:crypto";
import type { MongoClient } from "mongodb";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";
import type {
  FinancialEntity,
  RecurringExpense,
  OneTimeExpense,
  FundEntry,
} from "../../../database/mongodb/entity/financial.entity";
import type {
  FinancialSnapshotEntity,
  ProjectExpenseSnapshot,
} from "../../../database/mongodb/entity/financialSnapshot.entity";
import { FinancialRepository } from "../../../database/mongodb/repositories/financial.repository";
import { FinancialSnapshotRepository } from "../../../database/mongodb/repositories/financialSnapshot.repository";
import { ProjectRepository } from "../../../database/mongodb/repositories/project.repository";
import { ProjectOfferRepository } from "../../../database/mongodb/repositories/projectOffer.repository";
import type {
  FinancialCreateDto,
  RecurringExpenseCreateDto,
  RecurringExpenseUpdateDto,
  OneTimeExpenseCreateDto,
  OneTimeExpenseUpdateDto,
} from "./dto";
import { getDate, formatDate } from "@/v1/utils/utils";

export interface FinancialSummary {
  referenceMonth: string;
  fundEntries: FundEntry[];
  condominiumFund: number;
  previousBalance: number;
  totalRecurringExpenses: number;
  totalOneTimeExpenses: number;
  totalProjectExpenses: number;
  totalExpenses: number;
  monthlyBalance: number;
  recurringExpenses: RecurringExpense[];
  oneTimeExpenses: OneTimeExpense[];
  projectExpenses: ProjectExpenseSnapshot[];
}

export interface MonthCheckResult {
  monthChanged: boolean;
  previousMonth?: string;
  currentMonth: string;
  snapshotCreated: boolean;
  installmentsUpdated: number;
}

export class FinancialService {
  private financialRepository: FinancialRepository;
  private financialSnapshotRepository: FinancialSnapshotRepository;
  private projectRepository: ProjectRepository;
  private projectOfferRepository: ProjectOfferRepository;

  constructor(mongoClient: MongoClient) {
    this.financialRepository = new FinancialRepository(mongoClient);
    this.financialSnapshotRepository = new FinancialSnapshotRepository(
      mongoClient
    );
    this.projectRepository = new ProjectRepository(mongoClient);
    this.projectOfferRepository = new ProjectOfferRepository(mongoClient);
  }

  private getCurrentMonth(): string {
    return formatDate(getDate(), "YYYY-MM");
  }

  private getPreviousMonth(referenceMonth: string): string {
    const [year, month] = referenceMonth.split("-").map(Number);
    const date = new Date(year, month - 2, 1); // month - 2 porque Date usa 0-indexed
    return formatDate(date, "YYYY-MM");
  }

  /**
   * Verifica se o mês virou e realiza as atualizações necessárias:
   * 1. Cria snapshot do mês anterior
   * 2. Incrementa parcelas pagas dos projetos
   * 3. Cria novo registro financeiro para o mês atual
   */
  public async checkAndUpdateMonth(
    buildingId: string
  ): Promise<HttpResponse<MonthCheckResult>> {
    const currentMonth = this.getCurrentMonth();
    const currentFinancial =
      await this.financialRepository.findCurrentByBuildingId(buildingId);

    // Se não existe registro financeiro, retorna sem alterações
    if (!currentFinancial) {
      return {
        success: true,
        message:
          "Nenhum registro financeiro encontrado. Cadastre o caixa do condomínio.",
        data: {
          monthChanged: false,
          currentMonth,
          snapshotCreated: false,
          installmentsUpdated: 0,
        },
      };
    }

    // Se o mês do registro atual é o mesmo do mês corrente, não precisa atualizar
    if (currentFinancial.referenceMonth === currentMonth) {
      return {
        success: true,
        message: "Mês atual já está atualizado",
        data: {
          monthChanged: false,
          currentMonth,
          snapshotCreated: false,
          installmentsUpdated: 0,
        },
      };
    }

    // O mês virou! Precisamos processar a transição
    const previousMonth = currentFinancial.referenceMonth;

    // 1. Buscar projetos com parcelas pendentes
    const projectsWithPending =
      await this.projectRepository.findManyWithChosenOfferByBuildingId(
        buildingId
      );
    const offerIds = projectsWithPending
      .map((p) => p.chosenOfferId)
      .filter((id): id is string => id !== undefined);

    const offersWithPending =
      await this.projectOfferRepository.findPendingPaymentsByOfferIds(offerIds);

    // 2. Calcular despesas de projetos do mês anterior
    const projectExpenses: ProjectExpenseSnapshot[] = [];
    let totalProjectExpenses = 0;
    let installmentsUpdated = 0;

    for (const project of projectsWithPending) {
      if (!project.chosenOfferId) continue;

      const offer = offersWithPending.find(
        (o) => o._id === project.chosenOfferId
      );
      if (!offer) continue;

      // Verifica se o projeto já começou a ser pago (paymentStartDate existe)
      if (offer.paymentStartDate) {
        const monthlyValue = offer.totalValue / offer.installmentsCount;
        const currentPaidInstallments = offer.paidInstallments || 0;

        // Só adiciona se ainda tem parcelas pendentes
        if (currentPaidInstallments < offer.installmentsCount) {
          projectExpenses.push({
            projectId: project._id,
            projectTitle: project.title,
            offerId: offer._id,
            companyName: offer.companyName,
            totalValue: offer.totalValue,
            installmentsCount: offer.installmentsCount,
            paidInstallments: currentPaidInstallments,
            monthlyValue,
          });

          totalProjectExpenses += monthlyValue;

          // Incrementar parcela paga
          await this.projectOfferRepository.update(offer._id, {
            paidInstallments: currentPaidInstallments + 1,
          });
          installmentsUpdated++;
        }
      }
    }

    // 3. Calcular totais
    const totalRecurringExpenses = currentFinancial.recurringExpenses.reduce(
      (sum, exp) => sum + exp.value,
      0
    );
    const totalOneTimeExpenses = currentFinancial.oneTimeExpenses.reduce(
      (sum, exp) => sum + exp.value,
      0
    );
    const totalExpenses =
      totalRecurringExpenses + totalOneTimeExpenses + totalProjectExpenses;
    const finalBalance =
      currentFinancial.previousBalance +
      currentFinancial.condominiumFund -
      totalExpenses;

    // 4. Criar snapshot do mês anterior
    await this.financialSnapshotRepository.create({
      buildingId,
      referenceMonth: previousMonth,
      condominiumFund: currentFinancial.condominiumFund,
      previousBalance: currentFinancial.previousBalance,
      finalBalance,
      totalRecurringExpenses,
      totalOneTimeExpenses,
      totalProjectExpenses,
      recurringExpenses: currentFinancial.recurringExpenses.map((exp) => ({
        _id: exp._id,
        name: exp.name,
        value: exp.value,
      })),
      oneTimeExpenses: currentFinancial.oneTimeExpenses.map((exp) => ({
        _id: exp._id,
        name: exp.name,
        description: exp.description,
        value: exp.value,
        receiptImageUrl: exp.receiptImageUrl,
      })),
      projectExpenses,
    });

    // 5. Criar novo registro financeiro para o mês atual
    // Despesas recorrentes são copiadas, avulsas são zeradas
    await this.financialRepository.create({
      buildingId,
      referenceMonth: currentMonth,
      condominiumFund: 0, // Admin precisa cadastrar novo valor
      previousBalance: finalBalance, // Saldo do mês anterior
      recurringExpenses: currentFinancial.recurringExpenses, // Copia despesas recorrentes
      oneTimeExpenses: [], // Despesas avulsas são zeradas
    });

    return {
      success: true,
      message: `Mês atualizado de ${previousMonth} para ${currentMonth}. Snapshot criado e parcelas atualizadas.`,
      data: {
        monthChanged: true,
        previousMonth,
        currentMonth,
        snapshotCreated: true,
        installmentsUpdated,
      },
    };
  }

  /**
   * Obtém o resumo financeiro do mês atual
   */
  public async getFinancialSummary(
    buildingId: string
  ): Promise<HttpResponse<FinancialSummary>> {
    // Primeiro, verifica e atualiza o mês se necessário
    await this.checkAndUpdateMonth(buildingId);

    const currentMonth = this.getCurrentMonth();
    let financial = await this.financialRepository.findByBuildingIdAndMonth(
      buildingId,
      currentMonth
    );

    if (!financial) {
      // Se não existe, busca o último registro disponível ou retorna vazio
      financial = await this.financialRepository.findCurrentByBuildingId(
        buildingId
      );

      if (!financial) {
        return {
          success: true,
          message:
            "Nenhum registro financeiro encontrado. Cadastre o caixa do condomínio.",
          data: {
            referenceMonth: currentMonth,
            fundEntries: [],
            condominiumFund: 0,
            previousBalance: 0,
            totalRecurringExpenses: 0,
            totalOneTimeExpenses: 0,
            totalProjectExpenses: 0,
            totalExpenses: 0,
            monthlyBalance: 0,
            recurringExpenses: [],
            oneTimeExpenses: [],
            projectExpenses: [],
          },
        };
      }
    }

    // Buscar projetos com parcelas pendentes
    const projectExpenses = await this.getProjectExpenses(buildingId);

    const totalRecurringExpenses = financial.recurringExpenses.reduce(
      (sum, exp) => sum + exp.value,
      0
    );
    const totalOneTimeExpenses = financial.oneTimeExpenses.reduce(
      (sum, exp) => sum + exp.value,
      0
    );
    const totalProjectExpenses = projectExpenses.reduce(
      (sum, exp) => sum + exp.monthlyValue,
      0
    );
    const totalExpenses =
      totalRecurringExpenses + totalOneTimeExpenses + totalProjectExpenses;
    const monthlyBalance =
      financial.previousBalance + financial.condominiumFund - totalExpenses;

    return {
      success: true,
      message: "Resumo financeiro obtido com sucesso",
      data: {
        referenceMonth: financial.referenceMonth,
        fundEntries: financial.fundEntries || [],
        condominiumFund: financial.condominiumFund,
        previousBalance: financial.previousBalance,
        totalRecurringExpenses,
        totalOneTimeExpenses,
        totalProjectExpenses,
        totalExpenses,
        monthlyBalance,
        recurringExpenses: financial.recurringExpenses,
        oneTimeExpenses: financial.oneTimeExpenses,
        projectExpenses,
      },
    };
  }

  /**
   * Busca as despesas de projetos com parcelas pendentes
   */
  private async getProjectExpenses(
    buildingId: string
  ): Promise<ProjectExpenseSnapshot[]> {
    const projectsWithPending =
      await this.projectRepository.findManyWithChosenOfferByBuildingId(
        buildingId
      );
    const offerIds = projectsWithPending
      .map((p) => p.chosenOfferId)
      .filter((id): id is string => id !== undefined);

    if (offerIds.length === 0) return [];

    const offersWithPending =
      await this.projectOfferRepository.findPendingPaymentsByOfferIds(offerIds);

    const projectExpenses: ProjectExpenseSnapshot[] = [];

    for (const project of projectsWithPending) {
      if (!project.chosenOfferId) continue;

      const offer = offersWithPending.find(
        (o) => o._id === project.chosenOfferId
      );
      if (!offer || !offer.paymentStartDate) continue;

      const monthlyValue = offer.totalValue / offer.installmentsCount;
      const currentPaidInstallments = offer.paidInstallments || 0;

      // Só adiciona se ainda tem parcelas pendentes
      if (currentPaidInstallments < offer.installmentsCount) {
        projectExpenses.push({
          projectId: project._id,
          projectTitle: project.title,
          offerId: offer._id,
          companyName: offer.companyName,
          totalValue: offer.totalValue,
          installmentsCount: offer.installmentsCount,
          paidInstallments: currentPaidInstallments,
          monthlyValue,
        });
      }
    }

    return projectExpenses;
  }

  /**
   * Adiciona uma entrada de caixa ao mês atual
   * O síndico pode cadastrar múltiplas entradas, cada uma com título e valor
   */
  public async addFundEntry(
    financialCreateDto: FinancialCreateDto,
    buildingId: string
  ): Promise<HttpResponse<FinancialEntity>> {
    const { title, value } = financialCreateDto;
    const currentMonth = this.getCurrentMonth();

    // Buscar registro existente do mês atual
    let financial = await this.financialRepository.findByBuildingIdAndMonth(
      buildingId,
      currentMonth
    );

    // Se não existe registro para o mês atual, cria um novo
    if (!financial) {
      // Buscar saldo anterior (do último registro ou snapshot)
      let previousBalance = 0;
      const previousMonth = this.getPreviousMonth(currentMonth);
      const previousSnapshot =
        await this.financialSnapshotRepository.findByBuildingIdAndMonth(
          buildingId,
          previousMonth
        );

      if (previousSnapshot) {
        previousBalance = previousSnapshot.finalBalance;
      } else {
        // Se não existe snapshot, busca o registro financeiro mais recente
        const latestFinancial =
          await this.financialRepository.findCurrentByBuildingId(buildingId);
        if (latestFinancial) {
          // Calcula o saldo final do último registro
          const projectExpenses = await this.getProjectExpenses(buildingId);
          const totalRecurring = latestFinancial.recurringExpenses.reduce(
            (sum, e) => sum + e.value,
            0
          );
          const totalOneTime = latestFinancial.oneTimeExpenses.reduce(
            (sum, e) => sum + e.value,
            0
          );
          const totalProject = projectExpenses.reduce(
            (sum, e) => sum + e.monthlyValue,
            0
          );
          previousBalance =
            latestFinancial.previousBalance +
            latestFinancial.condominiumFund -
            totalRecurring -
            totalOneTime -
            totalProject;
        }
      }

      // Cria novo registro para o mês atual
      financial = await this.financialRepository.create({
        buildingId,
        referenceMonth: currentMonth,
        previousBalance,
        recurringExpenses: [],
        oneTimeExpenses: [],
      });

      // Copia despesas recorrentes do mês anterior
      const previousFinancial =
        await this.financialRepository.findByBuildingIdAndMonth(
          buildingId,
          previousMonth
        );

      if (previousFinancial && previousFinancial.recurringExpenses.length > 0) {
        await this.financialRepository.update(financial._id, {
          recurringExpenses: previousFinancial.recurringExpenses,
        });
        financial = (await this.financialRepository.findById(financial._id))!;
      }
    }

    // Criar a entrada de caixa
    const fundEntry: FundEntry = {
      _id: randomUUID(),
      title,
      value,
      createdAt: getDate(),
    };

    // Adicionar a entrada ao registro financeiro
    const updated = await this.financialRepository.addFundEntry(
      financial._id,
      fundEntry
    );

    if (!updated) {
      throw httpException(
        "Erro ao adicionar entrada de caixa",
        httpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return {
      success: true,
      message: "Entrada de caixa adicionada com sucesso",
      data: updated,
    };
  }

  /**
   * Adiciona uma despesa recorrente
   */
  public async addRecurringExpense(
    recurringExpenseDto: RecurringExpenseCreateDto,
    buildingId: string
  ): Promise<HttpResponse<FinancialEntity>> {
    const currentMonth = this.getCurrentMonth();
    let financial = await this.financialRepository.findByBuildingIdAndMonth(
      buildingId,
      currentMonth
    );

    if (!financial) {
      // Cria registro se não existe
      financial = await this.financialRepository.create({
        buildingId,
        referenceMonth: currentMonth,
        condominiumFund: 0,
        previousBalance: 0,
        recurringExpenses: [],
        oneTimeExpenses: [],
      });
    }

    const expense: RecurringExpense = {
      _id: randomUUID(),
      name: recurringExpenseDto.name,
      value: recurringExpenseDto.value,
    };

    const updated = await this.financialRepository.addRecurringExpense(
      financial._id,
      expense
    );

    if (!updated) {
      throw httpException(
        "Erro ao adicionar despesa recorrente",
        httpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return {
      success: true,
      message: "Despesa recorrente adicionada com sucesso",
      data: updated,
    };
  }

  /**
   * Atualiza uma despesa recorrente
   */
  public async updateRecurringExpense(
    expenseId: string,
    recurringExpenseDto: RecurringExpenseUpdateDto,
    buildingId: string
  ): Promise<HttpResponse<FinancialEntity>> {
    const currentMonth = this.getCurrentMonth();
    const financial = await this.financialRepository.findByBuildingIdAndMonth(
      buildingId,
      currentMonth
    );

    if (!financial) {
      throw httpException(
        "Registro financeiro não encontrado",
        httpStatus.NOT_FOUND
      );
    }

    const expenseExists = financial.recurringExpenses.find(
      (e) => e._id === expenseId
    );
    if (!expenseExists) {
      throw httpException(
        "Despesa recorrente não encontrada",
        httpStatus.NOT_FOUND
      );
    }

    const updated = await this.financialRepository.updateRecurringExpense(
      financial._id,
      expenseId,
      recurringExpenseDto
    );

    if (!updated) {
      throw httpException(
        "Erro ao atualizar despesa recorrente",
        httpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return {
      success: true,
      message: "Despesa recorrente atualizada com sucesso",
      data: updated,
    };
  }

  /**
   * Remove uma despesa recorrente
   */
  public async removeRecurringExpense(
    expenseId: string,
    buildingId: string
  ): Promise<HttpResponse<FinancialEntity>> {
    const currentMonth = this.getCurrentMonth();
    const financial = await this.financialRepository.findByBuildingIdAndMonth(
      buildingId,
      currentMonth
    );

    if (!financial) {
      throw httpException(
        "Registro financeiro não encontrado",
        httpStatus.NOT_FOUND
      );
    }

    const expenseExists = financial.recurringExpenses.find(
      (e) => e._id === expenseId
    );
    if (!expenseExists) {
      throw httpException(
        "Despesa recorrente não encontrada",
        httpStatus.NOT_FOUND
      );
    }

    const updated = await this.financialRepository.removeRecurringExpense(
      financial._id,
      expenseId
    );

    if (!updated) {
      throw httpException(
        "Erro ao remover despesa recorrente",
        httpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return {
      success: true,
      message: "Despesa recorrente removida com sucesso",
      data: updated,
    };
  }

  /**
   * Adiciona uma despesa avulsa
   */
  public async addOneTimeExpense(
    oneTimeExpenseDto: OneTimeExpenseCreateDto,
    buildingId: string
  ): Promise<HttpResponse<FinancialEntity>> {
    const currentMonth = this.getCurrentMonth();
    let financial = await this.financialRepository.findByBuildingIdAndMonth(
      buildingId,
      currentMonth
    );

    if (!financial) {
      // Cria registro se não existe
      financial = await this.financialRepository.create({
        buildingId,
        referenceMonth: currentMonth,
        condominiumFund: 0,
        previousBalance: 0,
        recurringExpenses: [],
        oneTimeExpenses: [],
      });
    }

    const expense: OneTimeExpense = {
      _id: randomUUID(),
      name: oneTimeExpenseDto.name,
      description: oneTimeExpenseDto.description,
      value: oneTimeExpenseDto.value,
      receiptImageUrl: oneTimeExpenseDto.receiptImageUrl,
    };

    const updated = await this.financialRepository.addOneTimeExpense(
      financial._id,
      expense
    );

    if (!updated) {
      throw httpException(
        "Erro ao adicionar despesa avulsa",
        httpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return {
      success: true,
      message: "Despesa avulsa adicionada com sucesso",
      data: updated,
    };
  }

  /**
   * Atualiza uma despesa avulsa
   */
  public async updateOneTimeExpense(
    expenseId: string,
    oneTimeExpenseDto: OneTimeExpenseUpdateDto,
    buildingId: string
  ): Promise<HttpResponse<FinancialEntity>> {
    const currentMonth = this.getCurrentMonth();
    const financial = await this.financialRepository.findByBuildingIdAndMonth(
      buildingId,
      currentMonth
    );

    if (!financial) {
      throw httpException(
        "Registro financeiro não encontrado",
        httpStatus.NOT_FOUND
      );
    }

    const expenseExists = financial.oneTimeExpenses.find(
      (e) => e._id === expenseId
    );
    if (!expenseExists) {
      throw httpException(
        "Despesa avulsa não encontrada",
        httpStatus.NOT_FOUND
      );
    }

    const updated = await this.financialRepository.updateOneTimeExpense(
      financial._id,
      expenseId,
      oneTimeExpenseDto
    );

    if (!updated) {
      throw httpException(
        "Erro ao atualizar despesa avulsa",
        httpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return {
      success: true,
      message: "Despesa avulsa atualizada com sucesso",
      data: updated,
    };
  }

  /**
   * Remove uma despesa avulsa
   */
  public async removeOneTimeExpense(
    expenseId: string,
    buildingId: string
  ): Promise<HttpResponse<FinancialEntity>> {
    const currentMonth = this.getCurrentMonth();
    const financial = await this.financialRepository.findByBuildingIdAndMonth(
      buildingId,
      currentMonth
    );

    if (!financial) {
      throw httpException(
        "Registro financeiro não encontrado",
        httpStatus.NOT_FOUND
      );
    }

    const expenseExists = financial.oneTimeExpenses.find(
      (e) => e._id === expenseId
    );
    if (!expenseExists) {
      throw httpException(
        "Despesa avulsa não encontrada",
        httpStatus.NOT_FOUND
      );
    }

    const updated = await this.financialRepository.removeOneTimeExpense(
      financial._id,
      expenseId
    );

    if (!updated) {
      throw httpException(
        "Erro ao remover despesa avulsa",
        httpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return {
      success: true,
      message: "Despesa avulsa removida com sucesso",
      data: updated,
    };
  }

  /**
   * Obtém histórico de snapshots
   */
  public async getSnapshots(
    buildingId: string
  ): Promise<HttpResponse<FinancialSnapshotEntity[]>> {
    const snapshots =
      await this.financialSnapshotRepository.findManyByBuildingId(buildingId);

    return {
      success: true,
      message: "Histórico financeiro obtido com sucesso",
      data: snapshots,
    };
  }

  /**
   * Obtém um snapshot específico por mês
   */
  public async getSnapshotByMonth(
    buildingId: string,
    referenceMonth: string
  ): Promise<HttpResponse<FinancialSnapshotEntity>> {
    const snapshot =
      await this.financialSnapshotRepository.findByBuildingIdAndMonth(
        buildingId,
        referenceMonth
      );

    if (!snapshot) {
      throw httpException(
        `Snapshot não encontrado para o mês ${referenceMonth}`,
        httpStatus.NOT_FOUND
      );
    }

    return {
      success: true,
      message: "Snapshot encontrado com sucesso",
      data: snapshot,
    };
  }

  /**
   * Obtém projetos em andamento (para dashboards e progresso)
   */
  public async getProjectsProgress(
    buildingId: string
  ): Promise<HttpResponse<ProjectExpenseSnapshot[]>> {
    const projectExpenses = await this.getProjectExpenses(buildingId);

    return {
      success: true,
      message: "Projetos em andamento obtidos com sucesso",
      data: projectExpenses,
    };
  }
}
