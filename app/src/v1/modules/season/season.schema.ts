export class SeasonSchema {
  private seasonResponse = {
    type: "object",
    properties: {
      _id: { type: "string" },
      buildingId: { type: "string" },
      seasonNumber: { type: "number" },
      reusedSuggestions: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      endDate: { type: ["string", "null"], format: "date-time" },
    },
  };

  public create = {
    body: {
      type: "object",
      required: ["reusedSuggestions"],
      properties: {
        reusedSuggestions: {
          type: "boolean",
          description: "Indica se as sugestões devem ser reutilizadas",
          example: false,
        },
      },
    },
    response: {
      201: {
        description: "Season criada com sucesso",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: this.seasonResponse,
        },
      },
      400: {
        description: "Dados inválidos ou já existe season em aberto",
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
    },
  };

  public getAllByBuilding = {
    response: {
      200: {
        description: "Seasons do prédio encontradas",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "array",
            items: this.seasonResponse,
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
          description: "ID da season",
        },
      },
    },
    response: {
      200: {
        description: "Season encontrada",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: this.seasonResponse,
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
        description: "Season não encontrada",
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
          description: "ID da season",
        },
      },
    },
    body: {
      type: "object",
      properties: {
        reusedSuggestions: {
          type: "boolean",
          description: "Indica se as sugestões devem ser reutilizadas",
          example: true,
        },
      },
    },
    response: {
      200: {
        description: "Season atualizada com sucesso",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: this.seasonResponse,
        },
      },
      400: {
        description: "Dados inválidos ou season já finalizada",
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
        description: "Season não encontrada",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
        },
      },
    },
  };

  public finish = {
    params: {
      type: "object",
      required: ["id"],
      properties: {
        id: {
          type: "string",
          format: "uuid",
          description: "ID da season",
        },
      },
    },
    response: {
      200: {
        description: "Season finalizada com sucesso",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: this.seasonResponse,
        },
      },
      400: {
        description: "Season já finalizada",
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
        description: "Season não encontrada",
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
          description: "ID da season",
        },
      },
    },
    response: {
      200: {
        description: "Season deletada com sucesso",
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
        description: "Season não encontrada",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
        },
      },
    },
  };

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

  private projectResponse = {
    type: "object",
    properties: {
      _id: { type: "string" },
      buildingId: { type: "string" },
      fromSeasonId: { type: "string" },
      title: { type: "string" },
      description: { type: "string" },
      votes: { type: "number" },
      rank: { type: ["number", "null"] },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  };

  public rankSuggestions = {
    params: {
      type: "object",
      required: ["id"],
      properties: {
        id: {
          type: "string",
          format: "uuid",
          description: "ID da season",
        },
      },
    },
    response: {
      200: {
        description: "Sugestões processadas e ranqueadas com sucesso",
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
        description: "Nenhuma sugestão encontrada",
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
        description: "Season não encontrada",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
        },
      },
    },
  };

  public promoteToProjects = {
    params: {
      type: "object",
      required: ["id"],
      properties: {
        id: {
          type: "string",
          format: "uuid",
          description: "ID da season",
        },
      },
    },
    querystring: {
      type: "object",
      properties: {
        topCount: {
          type: "integer",
          minimum: 1,
          maximum: 10,
          default: 3,
          description:
            "Quantidade de sugestões a serem promovidas para projetos (default: 3)",
        },
      },
    },
    response: {
      200: {
        description: "Projetos criados com sucesso",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "array",
            items: this.projectResponse,
          },
        },
      },
      400: {
        description: "Nenhuma sugestão encontrada ou votação não definida",
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
        description: "Season não encontrada",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
        },
      },
    },
  };
}
