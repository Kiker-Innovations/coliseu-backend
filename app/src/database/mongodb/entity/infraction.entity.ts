import type { FineStatusEnumType } from "@/v1/enum/fineStatus.enum";
import type { InfractionStatusEnumType } from "@/v1/enum/infractionStatus.enum";
import type { InfractionTypeEnumType } from "@/v1/enum/infractionType.enum";

export interface InfractionEntity {
	_id: string;
	apartmentId: string;
	fineId: string;
	type: InfractionTypeEnumType;
	description: string;
	value: number;
	occurrenceDate: Date;
	canceledNote?: string;
	status: FineStatusEnumType | InfractionStatusEnumType;
	createdAt: Date;
	contextedAt?: Date;
	confirmedAt?: Date;
	paidAt?: Date;
	canceledAt?: Date;
	updatedAt: Date;
}

export type CreateInfractionEntity = Omit<
	InfractionEntity,
	"_id" | "createdAt" | "updatedAt"
>;

export type UpdateInfractionEntity = Partial<
	Omit<InfractionEntity, "_id" | "createdAt">
>;
