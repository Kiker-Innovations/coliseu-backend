export const ProjectSuggestionStatusEnum = {
  AGUARDANDO_VOTACAO: "AGUARDANDO_VOTACAO",
  EM_VOTACAO: "EM_VOTACAO",
  VOTACAO_ENCERRADA: "VOTACAO_ENCERRADA",
} as const;

export type ProjectSuggestionStatusEnumType =
  (typeof ProjectSuggestionStatusEnum)[keyof typeof ProjectSuggestionStatusEnum];
