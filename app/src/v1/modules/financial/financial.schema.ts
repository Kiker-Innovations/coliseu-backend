export class FinancialSchema {
  private recurringExpenseResponse = {
    type: "object",
    properties: {
      _id: { type: "string" },
      name: { type: "string" },
      value: { type: "number" },
    },
  };

  private oneTimeExpenseResponse = {
    type: "object",
    properties: {
      _id: { type: "string" },
      name: { type: "string" },
      description: { type: "string" },
      value: { type: "number" },
      receiptImageUrl: { type: ["string", "null"] },
    },
  };

  private projectExpenseResponse = {
    type: "object",
    properties: {
      projectId: { type: "string" },
      projectTitle: { type: "string" },
      offerId: { type: "string" },
      companyName: { type: "string" },
      totalValue: { type: "number" },
      installmentsCount: { type: "number" },
      paidInstallments: { type: "number" },
      monthlyValue: { type: "number" },
    },
  };

  private fundEntryResponse = {
    type: "object",
    properties: {
      _id: { type: "string" },
      title: { type: "string" },
      value: { type: "number" },
      createdAt: { type: "string", format: "date-time" },
    },
  };

  private financialResponse = {
    type: "object",
    properties: {
      _id: { type: "string" },
      buildingId: { type: "string" },
      referenceMonth: { type: "string" },
      fundEntries: {
        type: "array",
        items: this.fundEntryResponse,
      },
      condominiumFund: { type: "number" },
      previousBalance: { type: "number" },
      recurringExpenses: {
        type: "array",
        items: this.recurringExpenseResponse,
      },
      oneTimeExpenses: {
        type: "array",
        items: this.oneTimeExpenseResponse,
      },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  };

  private summaryResponse = {
    type: "object",
    properties: {
      referenceMonth: { type: "string" },
      fundEntries: {
        type: "array",
        items: this.fundEntryResponse,
      },
      condominiumFund: { type: "number" },
      previousBalance: { type: "number" },
      totalRecurringExpenses: { type: "number" },
      totalOneTimeExpenses: { type: "number" },
      totalProjectExpenses: { type: "number" },
      totalExpenses: { type: "number" },
      monthlyBalance: { type: "number" },
      recurringExpenses: {
        type: "array",
        items: this.recurringExpenseResponse,
      },
      oneTimeExpenses: {
        type: "array",
        items: this.oneTimeExpenseResponse,
      },
      projectExpenses: {
        type: "array",
        items: this.projectExpenseResponse,
      },
    },
  };

  private snapshotResponse = {
    type: "object",
    properties: {
      _id: { type: "string" },
      buildingId: { type: "string" },
      referenceMonth: { type: "string" },
      condominiumFund: { type: "number" },
      previousBalance: { type: "number" },
      finalBalance: { type: "number" },
      totalRecurringExpenses: { type: "number" },
      totalOneTimeExpenses: { type: "number" },
      totalProjectExpenses: { type: "number" },
      recurringExpenses: {
        type: "array",
        items: this.recurringExpenseResponse,
      },
      oneTimeExpenses: {
        type: "array",
        items: this.oneTimeExpenseResponse,
      },
      projectExpenses: {
        type: "array",
        items: this.projectExpenseResponse,
      },
      createdAt: { type: "string", format: "date-time" },
    },
  };

  private monthCheckResponse = {
    type: "object",
    properties: {
      monthChanged: { type: "boolean" },
      previousMonth: { type: ["string", "null"] },
      currentMonth: { type: "string" },
      snapshotCreated: { type: "boolean" },
      installmentsUpdated: { type: "number" },
    },
  };

  private errorResponse = {
    type: "object",
    properties: {
      success: { type: "boolean" },
      message: { type: "string" },
    },
  };

  public checkMonth = {
    response: {
      200: {
        description: "Verificação de mês realizada",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: this.monthCheckResponse,
        },
      },
      401: {
        description: "Usuário não autenticado",
        ...this.errorResponse,
      },
    },
  };

  public getSummary = {
    response: {
      200: {
        description: "Resumo financeiro obtido",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: this.summaryResponse,
        },
      },
      401: {
        description: "Usuário não autenticado",
        ...this.errorResponse,
      },
    },
  };

  public addFundEntry = {
    body: {
      type: "object",
      required: ["title", "value"],
      properties: {
        title: {
          type: "string",
          minLength: 3,
          maxLength: 100,
          description: "Título/descrição da entrada de caixa",
          example: "Taxa de condomínio - Dezembro",
        },
        value: {
          type: "number",
          minimum: 0.01,
          description: "Valor da entrada de caixa",
          example: 50000,
        },
      },
    },
    response: {
      201: {
        description: "Entrada de caixa adicionada com sucesso",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: this.financialResponse,
        },
      },
      400: {
        description: "Dados inválidos",
        ...this.errorResponse,
      },
      401: {
        description: "Usuário não autenticado",
        ...this.errorResponse,
      },
      403: {
        description: "Acesso negado",
        ...this.errorResponse,
      },
    },
  };

  public addRecurringExpense = {
    body: {
      type: "object",
      required: ["name", "value"],
      properties: {
        name: {
          type: "string",
          minLength: 3,
          maxLength: 100,
          description: "Nome da despesa recorrente",
          example: "Manutenção Predial",
        },
        value: {
          type: "number",
          minimum: 0.01,
          description: "Valor da despesa",
          example: 3200,
        },
      },
    },
    response: {
      201: {
        description: "Despesa recorrente adicionada",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: this.financialResponse,
        },
      },
      400: {
        description: "Dados inválidos",
        ...this.errorResponse,
      },
      401: {
        description: "Usuário não autenticado",
        ...this.errorResponse,
      },
      403: {
        description: "Acesso negado",
        ...this.errorResponse,
      },
    },
  };

  public updateRecurringExpense = {
    params: {
      type: "object",
      required: ["id"],
      properties: {
        id: {
          type: "string",
          format: "uuid",
          description: "ID da despesa recorrente",
        },
      },
    },
    body: {
      type: "object",
      properties: {
        name: {
          type: "string",
          minLength: 3,
          maxLength: 100,
          description: "Nome da despesa recorrente",
        },
        value: {
          type: "number",
          minimum: 0.01,
          description: "Valor da despesa",
        },
      },
    },
    response: {
      200: {
        description: "Despesa recorrente atualizada",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: this.financialResponse,
        },
      },
      400: {
        description: "Dados inválidos",
        ...this.errorResponse,
      },
      401: {
        description: "Usuário não autenticado",
        ...this.errorResponse,
      },
      403: {
        description: "Acesso negado",
        ...this.errorResponse,
      },
      404: {
        description: "Despesa não encontrada",
        ...this.errorResponse,
      },
    },
  };

  public removeRecurringExpense = {
    params: {
      type: "object",
      required: ["id"],
      properties: {
        id: {
          type: "string",
          format: "uuid",
          description: "ID da despesa recorrente",
        },
      },
    },
    response: {
      200: {
        description: "Despesa recorrente removida",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: this.financialResponse,
        },
      },
      401: {
        description: "Usuário não autenticado",
        ...this.errorResponse,
      },
      403: {
        description: "Acesso negado",
        ...this.errorResponse,
      },
      404: {
        description: "Despesa não encontrada",
        ...this.errorResponse,
      },
    },
  };

  public addOneTimeExpense = {
    body: {
      type: "object",
      required: ["name", "description", "value"],
      properties: {
        name: {
          type: "string",
          minLength: 3,
          maxLength: 100,
          description: "Nome da despesa avulsa",
          example: "Reparo do Portão Principal",
        },
        description: {
          type: "string",
          minLength: 10,
          maxLength: 500,
          description: "Descrição detalhada da despesa",
          example:
            "Conserto do portão principal que estava com problema na trava eletrônica",
        },
        value: {
          type: "number",
          minimum: 0.01,
          description: "Valor da despesa",
          example: 850,
        },
        receiptImageUrl: {
          type: "string",
          format: "uri",
          description: "URL da imagem do recibo",
        },
      },
    },
    response: {
      201: {
        description: "Despesa avulsa adicionada",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: this.financialResponse,
        },
      },
      400: {
        description: "Dados inválidos",
        ...this.errorResponse,
      },
      401: {
        description: "Usuário não autenticado",
        ...this.errorResponse,
      },
      403: {
        description: "Acesso negado",
        ...this.errorResponse,
      },
    },
  };

  public updateOneTimeExpense = {
    params: {
      type: "object",
      required: ["id"],
      properties: {
        id: {
          type: "string",
          format: "uuid",
          description: "ID da despesa avulsa",
        },
      },
    },
    body: {
      type: "object",
      properties: {
        name: {
          type: "string",
          minLength: 3,
          maxLength: 100,
          description: "Nome da despesa avulsa",
        },
        description: {
          type: "string",
          minLength: 10,
          maxLength: 500,
          description: "Descrição detalhada da despesa",
        },
        value: {
          type: "number",
          minimum: 0.01,
          description: "Valor da despesa",
        },
        receiptImageUrl: {
          type: "string",
          format: "uri",
          description: "URL da imagem do recibo",
        },
      },
    },
    response: {
      200: {
        description: "Despesa avulsa atualizada",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: this.financialResponse,
        },
      },
      400: {
        description: "Dados inválidos",
        ...this.errorResponse,
      },
      401: {
        description: "Usuário não autenticado",
        ...this.errorResponse,
      },
      403: {
        description: "Acesso negado",
        ...this.errorResponse,
      },
      404: {
        description: "Despesa não encontrada",
        ...this.errorResponse,
      },
    },
  };

  public removeOneTimeExpense = {
    params: {
      type: "object",
      required: ["id"],
      properties: {
        id: {
          type: "string",
          format: "uuid",
          description: "ID da despesa avulsa",
        },
      },
    },
    response: {
      200: {
        description: "Despesa avulsa removida",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: this.financialResponse,
        },
      },
      401: {
        description: "Usuário não autenticado",
        ...this.errorResponse,
      },
      403: {
        description: "Acesso negado",
        ...this.errorResponse,
      },
      404: {
        description: "Despesa não encontrada",
        ...this.errorResponse,
      },
    },
  };

  public getSnapshots = {
    response: {
      200: {
        description: "Histórico financeiro obtido",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "array",
            items: this.snapshotResponse,
          },
        },
      },
      401: {
        description: "Usuário não autenticado",
        ...this.errorResponse,
      },
    },
  };

  public getSnapshotByMonth = {
    params: {
      type: "object",
      required: ["month"],
      properties: {
        month: {
          type: "string",
          pattern: "^\\d{4}-\\d{2}$",
          description: "Mês de referência no formato YYYY-MM",
        },
      },
    },
    response: {
      200: {
        description: "Snapshot encontrado",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: this.snapshotResponse,
        },
      },
      401: {
        description: "Usuário não autenticado",
        ...this.errorResponse,
      },
      404: {
        description: "Snapshot não encontrado",
        ...this.errorResponse,
      },
    },
  };

  public getProjectsProgress = {
    response: {
      200: {
        description: "Projetos em andamento obtidos",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "array",
            items: this.projectExpenseResponse,
          },
        },
      },
      401: {
        description: "Usuário não autenticado",
        ...this.errorResponse,
      },
    },
  };
}
