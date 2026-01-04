export const InfractionAppealTypeEnum = {
	CONTEXT: "context",
} as const;

export type InfractionAppealTypeEnumType = typeof InfractionAppealTypeEnum[keyof typeof InfractionAppealTypeEnum];

export const InfractionAppealTypeEnumValues = Object.values(InfractionAppealTypeEnum) as [string, ...string[]];

