import { PackageStatusEnumType } from "@/v1/enum/packageStatus.enum";

export interface PackageEntity {
  _id: string;
  apartmentId: string;
  buildingId: string;
  receiverBy: string;
  deliveryBy?: string; 
  ownerName?: string;
  courierName?: string;
  recipientName?: string;
  description?: string;
  receiverDate: Date;
  deliveryDate?: Date;
  status: PackageStatusEnumType;
  cancelReason?: string;
  canceledBy?: string; 
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type CreatePackageEntity = Omit<
  PackageEntity,
  "_id" | "createdAt" | "updatedAt"
>;

export type UpdatePackageEntity = Partial<
  Pick<PackageEntity, "apartmentId" | "buildingId" | "receiverBy" | "deliveryBy" | "ownerName" | "recipientName" | "courierName" | "description" | "receiverDate" | "deliveryDate" | "status" | "cancelReason" | "canceledBy" | "cancelledAt" | "updatedAt">
>;

export type ConfirmDeliveryPackageEntity = Pick<
  PackageEntity,
  "recipientName" | "deliveryBy"
> & {
  deliveryDate: Date;
  status: PackageStatusEnumType;
};
