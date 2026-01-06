export interface VisitEntity {
	_id: string;
	visitorId: string;
	apartmentId?: string;
	note?: string;
	registeredBy: string; // Nome do concierge
	registeredAt: Date;
	buildingId: string;
	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
}

export type CreateVisitEntity = Omit<
	VisitEntity,
	"_id" | "createdAt" | "updatedAt" | "deletedAt"
>;

export type UpdateVisitEntity = Partial<
	Omit<VisitEntity, "_id" | "createdAt" | "deletedAt">
>;
