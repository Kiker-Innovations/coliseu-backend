export const ProjectSuggestionPollStatusEnum = {
  AGUARDANDO_VOTACAO: "AGUARDANDO_VOTACAO",
  EM_VOTACAO: "EM_VOTACAO",
  VOTACAO_ENCERRADA: "VOTACAO_ENCERRADA",
} as const;

export type ProjectSuggestionPollStatusEnumType =
  keyof typeof ProjectSuggestionPollStatusEnum;
