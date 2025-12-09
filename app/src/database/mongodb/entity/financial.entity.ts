export interface RecurringExpense {
  _id: string;
  name: string;
  value: number;
}

export interface OneTimeExpense {
  _id: string;
  name: string;
  description: string;
  value: number;
  receiptImageUrl?: string;
}

/**
 * Entrada de caixa do condomínio
 * Cada entrada representa um valor cadastrado pelo síndico
 */
export interface FundEntry {
  _id: string;
  title: string;
  value: number;
  createdAt: Date;
}

export interface FinancialEntity {
  _id: string;
  buildingId: string;
  referenceMonth: string; // Formato: "YYYY-MM" (ex: "2025-01")
  fundEntries: FundEntry[]; // Array de entradas de caixa
  condominiumFund: number; // Total do caixa (soma de fundEntries)
  previousBalance: number; // Saldo do mês anterior
  recurringExpenses: RecurringExpense[];
  oneTimeExpenses: OneTimeExpense[];
  createdAt: Date;
  updatedAt: Date;
}

export type CreateFinancialEntity = Omit<
  FinancialEntity,
  "_id" | "fundEntries" | "condominiumFund" | "createdAt" | "updatedAt"
> & {
  fundEntries?: FundEntry[];
  condominiumFund?: number;
};

export type UpdateFinancialEntity = Partial<
  Pick<
    FinancialEntity,
    | "fundEntries"
    | "condominiumFund"
    | "previousBalance"
    | "recurringExpenses"
    | "oneTimeExpenses"
    | "updatedAt"
  >
>;

export type CreateRecurringExpense = Omit<RecurringExpense, "_id">;

export type CreateOneTimeExpense = Omit<OneTimeExpense, "_id">;

export type CreateFundEntry = Omit<FundEntry, "_id" | "createdAt">;
