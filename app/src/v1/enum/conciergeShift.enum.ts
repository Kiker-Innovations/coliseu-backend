export const ConciergeShiftEnum = {
  MANHA: "MANHA",
  TARDE: "TARDE",
  NOITE: "NOITE",
} as const;

export type ConciergeShiftEnumType = keyof typeof ConciergeShiftEnum;
