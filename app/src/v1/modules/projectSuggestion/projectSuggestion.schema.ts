export class ProjectSuggestionSchema {
  private projectSuggestionResponse = {
    type: "object",
    properties: {
      _id: { type: "string" },
      buildingId: { type: "string" },
      seasonId: { type: "string" },
      title: { type: "string" },
      description: { type: "string" },
      duplicateCount: { type: "number" },
      rank: { type: "number" },
      votes: { type: "number" },
      votingStartDate: { type: ["string", "null"], format: "date-time" },
      votingEndDate: { type: ["string", "null"], format: "date-time" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  };

  public getAllByBuildingAndSeason = {
    response: {
      200: {
        description: "Sugestões de projeto encontradas",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "array",
            items: this.projectSuggestionResponse,
          },
        },
      },
      401: {
        description: "Usuário não autenticado",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
        },
      },
      403: {
        description: "Acesso negado",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
        },
      },
    },
  };

  public getById = {
    params: {
      type: "object",
      required: ["id"],
      properties: {
        id: {
          type: "string",
          format: "uuid",
          description: "ID da sugestão de projeto",
        },
      },
    },
    response: {
      200: {
        description: "Sugestão de projeto encontrada",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: this.projectSuggestionResponse,
        },
      },
      401: {
        description: "Usuário não autenticado",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
        },
      },
      403: {
        description: "Acesso negado",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
        },
      },
      404: {
        description: "Sugestão de projeto não encontrada",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
        },
      },
    },
  };

  public update = {
    params: {
      type: "object",
      required: ["id"],
      properties: {
        id: {
          type: "string",
          format: "uuid",
          description: "ID da sugestão de projeto",
        },
      },
    },
    body: {
      type: "object",
      properties: {
        title: {
          type: "string",
          minLength: 3,
          maxLength: 100,
          description: "Título da sugestão de projeto",
          example: "Instalar câmeras de segurança",
        },
        description: {
          type: "string",
          minLength: 10,
          maxLength: 1000,
          description: "Descrição detalhada da sugestão",
          example:
            "Instalar câmeras de segurança em todas as áreas comuns do prédio",
        },
      },
    },
    response: {
      200: {
        description: "Sugestão de projeto atualizada com sucesso",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: this.projectSuggestionResponse,
        },
      },
      400: {
        description: "Dados inválidos ou votação já iniciada",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
        },
      },
      401: {
        description: "Usuário não autenticado",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
        },
      },
      403: {
        description: "Acesso negado",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
        },
      },
      404: {
        description: "Sugestão de projeto não encontrada",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
        },
      },
    },
  };

  public startVoting = {
    params: {
      type: "object",
      required: ["seasonId"],
      properties: {
        seasonId: {
          type: "string",
          format: "uuid",
          description: "ID da temporada",
        },
      },
    },
    body: {
      type: "object",
      required: ["votingStartDate", "votingEndDate"],
      properties: {
        votingStartDate: {
          type: "string",
          format: "date-time",
          description: "Data de início do período de votação",
          example: "2025-01-01T00:00:00.000Z",
        },
        votingEndDate: {
          type: "string",
          format: "date-time",
          description: "Data de fim do período de votação",
          example: "2025-01-15T23:59:59.999Z",
        },
      },
    },
    response: {
      200: {
        description: "Período de votação iniciado com sucesso",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "array",
            items: this.projectSuggestionResponse,
          },
        },
      },
      400: {
        description: "Dados inválidos ou nenhuma sugestão encontrada",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
        },
      },
      401: {
        description: "Usuário não autenticado",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
        },
      },
      403: {
        description: "Acesso negado",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
        },
      },
      404: {
        description: "Temporada não encontrada",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
        },
      },
    },
  };

  public delete = {
    params: {
      type: "object",
      required: ["id"],
      properties: {
        id: {
          type: "string",
          format: "uuid",
          description: "ID da sugestão de projeto",
        },
      },
    },
    response: {
      200: {
        description: "Sugestão de projeto deletada com sucesso",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: { type: "null" },
        },
      },
      401: {
        description: "Usuário não autenticado",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
        },
      },
      403: {
        description: "Acesso negado",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
        },
      },
      404: {
        description: "Sugestão de projeto não encontrada",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
        },
      },
    },
  };
}
