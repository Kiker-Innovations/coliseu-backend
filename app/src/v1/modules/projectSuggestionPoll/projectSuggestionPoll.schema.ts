export class ProjectSuggestionPollSchema {
  private voteResponse = {
    type: "object",
    properties: {
      id: { type: "string" },
      projectSuggestionId: { type: "string" },
      voteCount: { type: "number" },
      createdAt: { type: "string", format: "date-time" },
    },
  };

  private voteDetailResponse = {
    type: "object",
    properties: {
      id: { type: "string" },
      projectSuggestionId: { type: "string" },
      voteCount: { type: "number" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  };

  public vote = {
    body: {
      type: "object",
      required: ["projectSuggestionId", "voteCount"],
      properties: {
        projectSuggestionId: {
          type: "string",
          format: "uuid",
          description: "ID da sugestão de projeto",
        },
        voteCount: {
          type: "integer",
          minimum: 1,
          maximum: 3,
          description: "Quantidade de votos a atribuir (1 a 3)",
          example: 1,
        },
      },
    },
    response: {
      200: {
        description: "Voto registrado/atualizado com sucesso",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: this.voteResponse,
        },
      },
      400: {
        description: "Dados inválidos ou votos insuficientes",
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

  public deleteVote = {
    params: {
      type: "object",
      required: ["projectSuggestionId"],
      properties: {
        projectSuggestionId: {
          type: "string",
          format: "uuid",
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
        description: "Fora do período de votação",
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
        description: "Voto não encontrado",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
        },
      },
    },
  };

  public getMyVotes = {
    response: {
      200: {
        description: "Votos do morador encontrados",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              totalVotesUsed: { type: "number" },
              votesRemaining: { type: "number" },
              votes: {
                type: "array",
                items: this.voteResponse,
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
    },
  };

  public getMyVoteOnSuggestion = {
    params: {
      type: "object",
      required: ["projectSuggestionId"],
      properties: {
        projectSuggestionId: {
          type: "string",
          format: "uuid",
          description: "ID da sugestão de projeto",
        },
      },
    },
    response: {
      200: {
        description: "Voto do morador encontrado",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            anyOf: [this.voteDetailResponse, { type: "null" }],
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
