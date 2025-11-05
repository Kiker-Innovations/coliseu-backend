import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { AdminController } from "./admin.controller";
import { AdminSchema } from "./admin.schema";

export class AdminRouteV1 {
	private adminController: AdminController;
	private adminSchema: AdminSchema;

	constructor(mongoClient: MongoClient) {
		this.adminController = new AdminController(mongoClient);
		this.adminSchema = new AdminSchema();
	}

	private create = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/admins",
			schema: {
				tags: ["Admins"],
				summary: "Create a new admin",
				description:
					"Cria um novo administrador no sistema e envia email de confirmação",
				...this.adminSchema.create,
			},
			handler: this.adminController.createAdmin.bind(
				this.adminController,
			) as RouteHandlerMethod,
		};
	};

	private getById = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/admins/:id",
			schema: {
				tags: ["Admins"],
				summary: "Get admin by ID",
				description: "Busca um administrador específico por ID",
				...this.adminSchema.getById,
			},
			handler: this.adminController.getAdmin.bind(
				this.adminController,
			) as RouteHandlerMethod,
		};
	};

	private update = (): RouteOptions => {
		return {
			method: "PUT",
			url: "/v1/admins/:id",
			schema: {
				tags: ["Admins"],
				summary: "Update admin",
				description: "Atualiza dados de um administrador (nome)",
				...this.adminSchema.update,
			},
			handler: this.adminController.updateAdmin.bind(
				this.adminController,
			) as RouteHandlerMethod,
		};
	};

	private remove = (): RouteOptions => {
		return {
			method: "DELETE",
			url: "/v1/admins/:id",
			schema: {
				tags: ["Admins"],
				summary: "Delete admin",
				description: "Remove um administrador do sistema",
				...this.adminSchema.remove,
			},
			handler: this.adminController.deleteAdmin.bind(
				this.adminController,
			) as RouteHandlerMethod,
		};
	};

	private confirm = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/admins/confirm",
			schema: {
				tags: ["Admins"],
				summary: "Confirm admin email",
				description: "Confirma o código de verificação enviado por email",
				...this.adminSchema.confirm,
			},
			handler: this.adminController.confirmAdmin.bind(
				this.adminController,
			) as RouteHandlerMethod,
		};
	};

	private forgetPassword = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/admins/forget-password",
			schema: {
				tags: ["Admins"],
				summary: "Request password reset",
				description:
					"Solicita recuperação de senha. Um código de 6 dígitos será enviado por email (válido por 15 minutos)",
				...this.adminSchema.forgetPassword,
			},
			handler: this.adminController.forgetPassword.bind(
				this.adminController,
			) as RouteHandlerMethod,
		};
	};

	private resetPassword = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/admins/reset-password",
			schema: {
				tags: ["Admins"],
				summary: "Reset password with code",
				description:
					"Redefine a senha usando o código de recuperação recebido por email",
				...this.adminSchema.resetPassword,
			},
			handler: this.adminController.resetPassword.bind(
				this.adminController,
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
			this.forgetPassword(),
			this.resetPassword(),
		];
	};
}

