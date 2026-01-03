export interface ProjectExpenseSnapshot {
  projectId: string;
  projectTitle: string;
  offerId: string;
  companyName: string;
  totalValue: number;
  installmentsCount: number;
  paidInstallments: number;
  monthlyValue: number;
}

export interface RecurringExpenseSnapshot {
  _id: string;
  name: string;
  value: number;
}

export interface OneTimeExpenseSnapshot {
  _id: string;
  name: string;
  description: string;
  value: number;
  receiptImageUrl?: string;
}

export interface FinancialSnapshotEntity {
  _id: string;
  buildingId: string;
  referenceMonth: string; // Formato: "YYYY-MM" (ex: "2025-01")
  condominiumFund: number; // Arrecadação do mês
  previousBalance: number; // Saldo anterior ao mês
  finalBalance: number; // Saldo final do mês (previousBalance + condominiumFund - despesas)
  totalRecurringExpenses: number;
  totalOneTimeExpenses: number;
  totalProjectExpenses: number;
  recurringExpenses: RecurringExpenseSnapshot[];
  oneTimeExpenses: OneTimeExpenseSnapshot[];
  projectExpenses: ProjectExpenseSnapshot[];
  createdAt: Date;
}

export type CreateFinancialSnapshotEntity = Omit<
  FinancialSnapshotEntity,
  "_id" | "createdAt"
>;
