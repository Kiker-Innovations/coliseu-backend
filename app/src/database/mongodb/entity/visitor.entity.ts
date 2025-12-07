import type { VehicleTypeEnumType } from "@/v1/enum/vehicleType.enum";

export interface VisitorEntity {
	_id: string;
	name: string;
	email?: string;
	document?: string;
	phone?: string;
	vehicleType?: VehicleTypeEnumType;
	vehiclePlate?: string;
	types: string[]; // "CONVIDADO" | "PRESTADOR"
	photoUrl: string;
	note?: string;
	registeredBy: string; // Nome do concierge
	registeredAt: Date;
	updatedBy?: string; // Nome do concierge que fez a atualização
	buildingId: string;
	active: boolean;
	deletedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

export type CreateVisitorEntity = Omit<
	VisitorEntity,
	"_id" | "createdAt" | "updatedAt" | "deletedAt"
>;

export type UpdateVisitorEntity = Partial<
	Omit<VisitorEntity, "_id" | "createdAt" | "deletedAt">
>;

