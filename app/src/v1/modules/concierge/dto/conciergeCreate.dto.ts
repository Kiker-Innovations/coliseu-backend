import { z } from "zod";
import type { ConciergeShiftEnumType } from "@/v1/enum/conciergeShift.enum";

export const conciergeCreateSchema = z.object({
  name: z
    .string({ required_error: "Nome é obrigatório" })
    .min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z
    .string({ required_error: "Email é obrigatório" })
    .email("Email deve ser válido"),
  password: z
    .string({ required_error: "Senha é obrigatória" })
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .refine((val) => /[A-Z]/.test(val), "Senha deve conter pelo menos uma letra maiúscula")
    .refine((val) => /[a-z]/.test(val), "Senha deve conter pelo menos uma letra minúscula")
    .refine(
      (val) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val),
      "Senha deve conter pelo menos um caractere especial",
    ),
  phone: z
    .string({ required_error: "Telefone é obrigatório" })
    .regex(/^\+\d{11,15}$/, "Telefone deve estar no formato internacional (ex: +5511999999999)"),
  shift: z.enum(["MANHA", "TARDE", "NOITE"], {
    required_error: "Turno é obrigatório",
  }) as unknown as z.ZodType<ConciergeShiftEnumType>,
});

export type ConciergeCreateDto = z.infer<typeof conciergeCreateSchema>;

export const transformCreateConciergeDto = (
  data: ConciergeCreateDto,
): ConciergeCreateDto => {
  return conciergeCreateSchema.parse(data);
};
