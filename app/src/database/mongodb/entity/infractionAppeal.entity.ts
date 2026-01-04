import type { InfractionAppealTypeEnumType } from "@/v1/enum/InfractionAppealType";

export interface InfractionAppealEntity {
	_id: string;
	fineId: string;
	residentId: string;
	type: InfractionAppealTypeEnumType;
	text: string;
	fileName: string;
	fileSize: number;
	url: string;
	createdAt: Date;
}

export type CreateInfractionAppealEntity = Omit<
	InfractionAppealEntity,
	"_id" | "createdAt"
>;

export type UpdateInfractionAppealEntity = Partial<
	Omit<InfractionAppealEntity, "_id" | "createdAt">
>;

