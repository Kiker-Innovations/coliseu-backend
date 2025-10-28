/**
 * Enum para status de morador
 * - INATIVO: Morador cadastrado mas ainda não validou o email
 * - VALIDADO: Morador validou o email mas ainda não está ativo no sistema
 * - ATIVO: Morador completamente ativo e autorizado
 */
export const ResidentStatusEnum = {
	INATIVO: "INATIVO",
	VALIDADO: "VALIDADO",
	ATIVO: "ATIVO",
} as const;

export type ResidentStatusEnumType = keyof typeof ResidentStatusEnum;
