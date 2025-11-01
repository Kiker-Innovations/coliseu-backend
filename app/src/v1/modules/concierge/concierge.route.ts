import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { ConciergeController } from "./concierge.controller";
import { ConciergeSchema } from "./concierge.schema";

export class ConciergeRouteV1 {
	private conciergeController: ConciergeController;
	private conciergeSchema: ConciergeSchema;

	constructor(mongoClient: MongoClient) {
		this.conciergeController = new ConciergeController(mongoClient);
		this.conciergeSchema = new ConciergeSchema();
	}

	private create = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/concierges",
			schema: {
				tags: ["Concierges"],
				summary: "Create a new concierge",
				description:
					"Cria um novo porteiro no sistema e envia email de confirmação",
				...this.conciergeSchema.create,
			},
			handler: this.conciergeController.createConcierge.bind(
				this.conciergeController,
			) as RouteHandlerMethod,
		};
	};

	private getById = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/concierges/:id",
			schema: {
				tags: ["Concierges"],
				summary: "Get concierge by ID",
				description: "Busca um porteiro específico por ID",
				...this.conciergeSchema.getById,
			},
			handler: this.conciergeController.getConcierge.bind(
				this.conciergeController,
			) as RouteHandlerMethod,
		};
	};

	private update = (): RouteOptions => {
		return {
			method: "PUT",
			url: "/v1/concierges/:id",
			schema: {
				tags: ["Concierges"],
				summary: "Update concierge",
				description: "Atualiza dados de um porteiro (phone, photoUrl)",
				...this.conciergeSchema.update,
			},
			handler: this.conciergeController.updateConcierge.bind(
				this.conciergeController,
			) as RouteHandlerMethod,
		};
	};

	private remove = (): RouteOptions => {
		return {
			method: "DELETE",
			url: "/v1/concierges/:id",
			schema: {
				tags: ["Concierges"],
				summary: "Delete concierge",
				description: "Remove um porteiro do sistema",
				...this.conciergeSchema.remove,
			},
			handler: this.conciergeController.deleteConcierge.bind(
				this.conciergeController,
			) as RouteHandlerMethod,
		};
	};

	private confirm = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/concierges/confirm",
			schema: {
				tags: ["Concierges"],
				summary: "Confirm concierge email",
				description: "Confirma o código de verificação enviado por email",
				...this.conciergeSchema.confirm,
			},
			handler: this.conciergeController.confirmConcierge.bind(
				this.conciergeController,
			) as RouteHandlerMethod,
		};
	};

	private getMany = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/concierges/getmany",
			schema: {
				tags: ["Concierges"],
				summary: "Get all concierges",
				description: "Retorna todos os porteiros cadastrados no sistema",
				...this.conciergeSchema.getMany,
			},
			handler: this.conciergeController.getManyConcierges.bind(
				this.conciergeController,
			) as RouteHandlerMethod,
		};
	};

	private forgetPassword = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/concierges/forget-password",
			schema: {
				tags: ["Concierges"],
				summary: "Request password reset",
				description: "Solicita redefinição de senha. Envia email com token de reset.",
				...this.conciergeSchema.forgetPassword,
			},
			handler: this.conciergeController.forgetPassword.bind(
				this.conciergeController,
			) as RouteHandlerMethod,
		};
	};

	private resetPassword = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/concierges/reset-password",
			schema: {
				tags: ["Concierges"],
				summary: "Reset password",
				description: "Redefine a senha usando o token recebido por email",
				...this.conciergeSchema.resetPassword,
			},
			handler: this.conciergeController.resetPassword.bind(
				this.conciergeController,
			) as RouteHandlerMethod,
		};
	};

	private login = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/concierges/login",
			schema: {
				tags: ["Concierges"],
				summary: "Login concierge",
				description: "Realiza login do porteiro validando email e senha",
				...this.conciergeSchema.login,
			},
			handler: this.conciergeController.login.bind(
				this.conciergeController,
			) as RouteHandlerMethod,
		};
	};

	public routes = (): RouteOptions[] => {
		return [
			this.create(),
			this.getById(),
			this.update(),
			this.remove(),
			this.confirm(),
			this.getMany(),
			this.forgetPassword(),
			this.resetPassword(),
			this.login(),
		];
	};
}
