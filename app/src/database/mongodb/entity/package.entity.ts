import { PackageStatusEnumType } from "@/v1/enum/packageStatus.enum";

export interface PackageEntity {
  _id: string;
  apartmentId: string;
  receiverConciergeId: string;
  deliveryConciergeId?: string;
  ownerName: string;
  courierName?: string;
  recipientName?: string;
  description: string;
  receiverDate: Date;
  deliveryDate?: Date;
  status: PackageStatusEnumType;
  createdAt: Date;
  updatedAt: Date;
}

export type CreatePackageEntity = Omit<
  PackageEntity,
  "_id" | "createdAt" | "updatedAt"
>;

export type UpdatePackageEntity = Partial<
  Pick<PackageEntity, "apartmentId" | "receiverConciergeId" | "deliveryConciergeId" | "ownerName" | "recipientName" | "courierName" | "description" | "receiverDate" | "deliveryDate" | "status" | "updatedAt">
>;

export type ConfirmDeliveryPackageEntity = Pick<
  PackageEntity,
  "recipientName" | "deliveryConciergeId"
> & {
  deliveryDate: Date;
  status: PackageStatusEnumType;
};
