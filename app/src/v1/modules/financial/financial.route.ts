import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { FinancialController } from "./financial.controller";
import { FinancialSchema } from "./financial.schema";
import { AuthMiddleware } from "../auth/auth.middleware";

const MODULE_TAG = "financial";

export class FinancialRouteV1 {
	private financialController: FinancialController;
	private financialSchema: FinancialSchema;
	private authMiddleware: AuthMiddleware;

	constructor(mongoClient: MongoClient) {
		this.financialController = new FinancialController(mongoClient);
		this.financialSchema = new FinancialSchema();
		this.authMiddleware = new AuthMiddleware(mongoClient);
	}

	private checkMonth = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/financial/check-month",
			schema: {
				tags: ["Financial"],
				summary: "Check and update month",
				description:
					"Verifica se o mês virou e atualiza as parcelas dos projetos. Deve ser chamado ao entrar nas telas financeiras.",
				...this.financialSchema.checkMonth,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.financialController.checkMonth.bind(
				this.financialController,
			) as RouteHandlerMethod,
		};
	};

	private getSummary = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/financial/summary",
			schema: {
				tags: ["Financial"],
				summary: "Get financial summary",
				description:
					"Obtém o resumo financeiro do mês atual, incluindo despesas e saldo",
				...this.financialSchema.getSummary,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.financialController.getSummary.bind(
				this.financialController,
			) as RouteHandlerMethod,
		};
	};

	private addFundEntry = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/financial/fund",
			schema: {
				tags: ["Financial"],
				summary: "Add fund entry",
				description:
					"Adiciona uma entrada de caixa do condomínio para o mês atual",
				...this.financialSchema.addFundEntry,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "create"),
			],
			handler: this.financialController.addFundEntry.bind(
				this.financialController,
			) as RouteHandlerMethod,
		};
	};

	private addRecurringExpense = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/financial/recurring-expenses",
			schema: {
				tags: ["Financial"],
				summary: "Add recurring expense",
				description: "Adiciona uma nova despesa recorrente ao mês atual",
				...this.financialSchema.addRecurringExpense,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "create"),
			],
			handler: this.financialController.addRecurringExpense.bind(
				this.financialController,
			) as RouteHandlerMethod,
		};
	};

	private updateRecurringExpense = (): RouteOptions => {
		return {
			method: "PUT",
			url: "/v1/financial/recurring-expenses/:id",
			schema: {
				tags: ["Financial"],
				summary: "Update recurring expense",
				description: "Atualiza uma despesa recorrente existente",
				...this.financialSchema.updateRecurringExpense,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "update"),
			],
			handler: this.financialController.updateRecurringExpense.bind(
				this.financialController,
			) as RouteHandlerMethod,
		};
	};

	private removeRecurringExpense = (): RouteOptions => {
		return {
			method: "DELETE",
			url: "/v1/financial/recurring-expenses/:id",
			schema: {
				tags: ["Financial"],
				summary: "Remove recurring expense",
				description: "Remove uma despesa recorrente",
				...this.financialSchema.removeRecurringExpense,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "delete"),
			],
			handler: this.financialController.removeRecurringExpense.bind(
				this.financialController,
			) as RouteHandlerMethod,
		};
	};

	private addOneTimeExpense = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/financial/one-time-expenses",
			schema: {
				tags: ["Financial"],
				summary: "Add one-time expense",
				description: "Adiciona uma nova despesa avulsa ao mês atual",
				...this.financialSchema.addOneTimeExpense,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "create"),
			],
			handler: this.financialController.addOneTimeExpense.bind(
				this.financialController,
			) as RouteHandlerMethod,
		};
	};

	private updateOneTimeExpense = (): RouteOptions => {
		return {
			method: "PUT",
			url: "/v1/financial/one-time-expenses/:id",
			schema: {
				tags: ["Financial"],
				summary: "Update one-time expense",
				description: "Atualiza uma despesa avulsa existente",
				...this.financialSchema.updateOneTimeExpense,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "update"),
			],
			handler: this.financialController.updateOneTimeExpense.bind(
				this.financialController,
			) as RouteHandlerMethod,
		};
	};

	private removeOneTimeExpense = (): RouteOptions => {
		return {
			method: "DELETE",
			url: "/v1/financial/one-time-expenses/:id",
			schema: {
				tags: ["Financial"],
				summary: "Remove one-time expense",
				description: "Remove uma despesa avulsa",
				...this.financialSchema.removeOneTimeExpense,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "delete"),
			],
			handler: this.financialController.removeOneTimeExpense.bind(
				this.financialController,
			) as RouteHandlerMethod,
		};
	};

	private getSnapshots = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/financial/snapshots",
			schema: {
				tags: ["Financial"],
				summary: "Get financial snapshots",
				description:
					"Obtém o histórico financeiro (snapshots de meses anteriores)",
				...this.financialSchema.getSnapshots,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.financialController.getSnapshots.bind(
				this.financialController,
			) as RouteHandlerMethod,
		};
	};

	private getSnapshotByMonth = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/financial/snapshots/:month",
			schema: {
				tags: ["Financial"],
				summary: "Get snapshot by month",
				description: "Obtém o snapshot de um mês específico",
				...this.financialSchema.getSnapshotByMonth,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.financialController.getSnapshotByMonth.bind(
				this.financialController,
			) as RouteHandlerMethod,
		};
	};

	private getProjectsProgress = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/financial/projects-progress",
			schema: {
				tags: ["Financial"],
				summary: "Get projects progress",
				description:
					"Obtém o progresso dos projetos em andamento (parcelas pagas/pendentes)",
				...this.financialSchema.getProjectsProgress,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.financialController.getProjectsProgress.bind(
				this.financialController,
			) as RouteHandlerMethod,
		};
	};

	public routes = (): RouteOptions[] => {
		return [
			this.checkMonth(),
			this.getSummary(),
			this.addFundEntry(),
			this.addRecurringExpense(),
			this.updateRecurringExpense(),
			this.removeRecurringExpense(),
			this.addOneTimeExpense(),
			this.updateOneTimeExpense(),
			this.removeOneTimeExpense(),
			this.getSnapshots(),
			this.getSnapshotByMonth(),
			this.getProjectsProgress(),
		];
	};
}
