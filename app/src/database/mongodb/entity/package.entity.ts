import { PackageStatusEnumType } from "@/v1/enum/packageStatus.enum";

export interface PackageEntity {
  _id: string;
  apartmentId: string;
  buildingId: string;
  receiverConciergeId: string;
  deliveryConciergeId?: string;
  ownerName?: string;
  courierName?: string;
  recipientName?: string;
  description?: string;
  receiverDate: Date;
  deliveryDate?: Date;
  status: PackageStatusEnumType;
  cancelReason?: string;
  cancelledConciergeId?: string;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type CreatePackageEntity = Omit<
  PackageEntity,
  "_id" | "createdAt" | "updatedAt"
>;

export type UpdatePackageEntity = Partial<
  Pick<PackageEntity, "apartmentId" | "buildingId" | "receiverConciergeId" | "deliveryConciergeId" | "ownerName" | "recipientName" | "courierName" | "description" | "receiverDate" | "deliveryDate" | "status" | "cancelReason" | "cancelledConciergeId" | "cancelledAt" | "updatedAt">
>;

export type ConfirmDeliveryPackageEntity = Pick<
  PackageEntity,
  "recipientName" | "deliveryConciergeId"
> & {
  deliveryDate: Date;
  status: PackageStatusEnumType;
};
