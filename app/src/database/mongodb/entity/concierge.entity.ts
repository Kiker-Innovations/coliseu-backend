import type { ConciergeShiftEnumType } from "@/v1/enum/conciergeShift.enum";
import { ConciergeStatusEnumType } from "@/v1/enum/conciergeStatus.enum";

export interface ConciergeEntity {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  shift: ConciergeShiftEnumType; 
  status: ConciergeStatusEnumType;
  code: string;
  resetPasswordToken?: string;
  resetPasswordTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateConciergeEntity = Omit<
  ConciergeEntity,
  "_id" | "createdAt" | "updatedAt"
>;

export type UpdateConciergeEntity = Partial<
  Pick<ConciergeEntity, "phone" | "status"| "shift" | "passwordHash" | "resetPasswordToken" | "resetPasswordTokenExpiry" | "updatedAt">
>;
