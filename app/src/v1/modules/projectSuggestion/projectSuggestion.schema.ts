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
      votingStartDate: { type: ["string", "null"] },
      votingEndDate: { type: ["string", "null"] },
      status: { type: "string" },
      createdAt: { type: "string" },
      updatedAt: { type: "string" },
    },
  };

  public rankSuggestions = {
    params: {
      type: "object",
      required: ["seasonId"],
      properties: {
        seasonId: {
          type: "string",
          description: "ID da season",
        },
      },
    },
    response: {
      201: {
        description: "Sugestões rankeadas com sucesso",
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
        description: "Dados inválidos ou sugestões já rankeadas",
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

  public getBySeasonId = {
    params: {
      type: "object",
      required: ["seasonId"],
      properties: {
        seasonId: {
          type: "string",
          description: "ID da season",
        },
      },
    },
    response: {
      200: {
        description: "Sugestões encontradas com sucesso",
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

  public startVoting = {
    params: {
      type: "object",
      required: ["seasonId"],
      properties: {
        seasonId: {
          type: "string",
          description: "ID da season",
        },
      },
    },
    body: {
      type: "object",
      required: ["votingStartDate", "votingEndDate"],
      properties: {
        votingStartDate: {
          type: "string",
          description: "Data e hora de início da votação (ISO 8601)",
          example: "2025-01-15T09:00:00.000Z",
        },
        votingEndDate: {
          type: "string",
          description: "Data e hora de fim da votação (ISO 8601)",
          example: "2025-01-30T18:00:00.000Z",
        },
      },
    },
    response: {
      200: {
        description: "Votação iniciada com sucesso",
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
        description: "Season não encontrada",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
        },
      },
    },
  };

  public endVoting = {
    params: {
      type: "object",
      required: ["seasonId"],
      properties: {
        seasonId: {
          type: "string",
          description: "ID da season",
        },
      },
    },
    response: {
      200: {
        description: "Votação encerrada com sucesso",
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
        description: "Votação não está em andamento",
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

  public vote = {
    body: {
      type: "object",
      required: ["projectSuggestionId", "voteCount"],
      properties: {
        projectSuggestionId: {
          type: "string",
          description: "ID da sugestão de projeto",
          example: "b2ce3bcd-6309-42a5-861c-33bdefb7ab33",
        },
        voteCount: {
          type: "integer",
          description:
            "Quantidade de votos (1 a 3). O total de votos do morador na season não pode exceder 3",
          example: 2,
        },
      },
    },
    response: {
      200: {
        description: "Voto registrado ou atualizado com sucesso",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              id: { type: "string" },
              projectSuggestionId: { type: "string" },
              voteCount: { type: "integer" },
            },
          },
        },
      },
      400: {
        description:
          "Dados inválidos ou período de votação inválido ou votos insuficientes",
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
        description: "Sugestão não encontrada",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
        },
      },
    },
  };

  public deleteVote = {
    params: {
      type: "object",
      required: ["projectSuggestionId"],
      properties: {
        projectSuggestionId: {
          type: "string",
          description: "ID da sugestão de projeto",
        },
      },
    },
    response: {
      200: {
        description: "Voto removido com sucesso",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: { type: "null" },
        },
      },
      400: {
        description: "Período de votação inválido",
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
        description: "Sugestão ou voto não encontrado",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
        },
      },
    },
  };

  public getMyVotes = {
    params: {
      type: "object",
      required: ["seasonId"],
      properties: {
        seasonId: {
          type: "string",
          description: "ID da season",
        },
      },
    },
    response: {
      200: {
        description: "Votos do morador encontrados com sucesso",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                projectSuggestionId: { type: "string" },
                voteCount: { type: "integer" },
              },
            },
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
      404: {
        description: "Season ou morador não encontrado",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
        },
      },
    },
  };

  public createProjectsFromTopSuggestions = {
    params: {
      type: "object",
      required: ["seasonId"],
      properties: {
        seasonId: {
          type: "string",
          description: "ID da season",
        },
      },
    },
    body: {
      type: "object",
      properties: {
        top: {
          type: "integer",
          description:
            "Quantidade de projetos a serem criados a partir das sugestões mais votadas (default: 3)",
          example: 3,
        },
      },
    },
    response: {
      201: {
        description: "Projetos criados com sucesso",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                description: { type: "string" },
                votes: { type: "integer" },
              },
            },
          },
        },
      },
      400: {
        description: "Votação não encerrada ou dados inválidos",
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
