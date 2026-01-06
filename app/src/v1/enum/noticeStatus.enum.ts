export const NoticeStatusEnum = {
	ATIVO: "ATIVO",
	INATIVO: "INATIVO",
} as const;

export type NoticeStatusEnumType =
	(typeof NoticeStatusEnum)[keyof typeof NoticeStatusEnum];
