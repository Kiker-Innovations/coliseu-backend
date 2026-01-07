import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { AdminController } from "./admin.controller";
import { AdminSchema } from "./admin.schema";
import { AuthMiddleware } from "../auth/auth.middleware";
import { UserTypeEnum } from "../../enum/userType.enum";

const MODULE_TAG = "admin";

export class AdminRouteV1 {
	private adminController: AdminController;
	private adminSchema: AdminSchema;
	private authMiddleware: AuthMiddleware;

	constructor(mongoClient: MongoClient) {
		this.adminController = new AdminController(mongoClient);
		this.adminSchema = new AdminSchema();
		this.authMiddleware = new AuthMiddleware(mongoClient);
	}

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
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.adminController.getAdmin.bind(
				this.adminController,
			) as RouteHandlerMethod,
		};
	};

	private getMe = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/admins/me",
			schema: {
				tags: ["Admins"],
				summary: "Get current admin profile",
				description: "Busca o perfil do administrador autenticado",
				...this.adminSchema.getMe,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.adminController.getCurrentAdmin.bind(
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
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "update"),
			],
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
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "delete"),
			],
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
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "update"),
			],
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
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "update"),
			],
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
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "update"),
			],
			handler: this.adminController.resetPassword.bind(
				this.adminController,
			) as RouteHandlerMethod,
		};
	};

	private changePassword = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/admins/me/password",
			schema: {
				tags: ["Admins"],
				summary: "Change admin password",
				description: "Altera a senha do administrador autenticado",
				...this.adminSchema.changePassword,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "update"),
			],
			handler: this.adminController.changePassword.bind(
				this.adminController,
			) as RouteHandlerMethod,
		};
	};

	private getResidents = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/admins/residents",
			schema: {
				tags: ["Admins"],
				summary: "Get residents by building",
				description: "Lista residentes do edifício com paginação e filtros",
				...this.adminSchema.getResidents,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.adminController.getResidents.bind(
				this.adminController,
			) as RouteHandlerMethod,
		};
	};

	private countResidents = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/admins/residents/count",
			schema: {
				tags: ["Admins"],
				summary: "Count residents by building",
				description: "Retorna a contagem total de residentes do edifício",
				...this.adminSchema.countResidents,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.adminController.countResidents.bind(
				this.adminController,
			) as RouteHandlerMethod,
		};
	};

	private getResidentById = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/admins/residents/:id",
			schema: {
				tags: ["Admins"],
				summary: "Get resident by ID",
				description:
					"Busca um residente específico por ID com todos os dados (incluindo apartamento)",
				...this.adminSchema.getResidentById,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.checkPermission(MODULE_TAG, "read"),
			],
			handler: this.adminController.getResidentById.bind(
				this.adminController,
			) as RouteHandlerMethod,
		};
	};

	private approveResident = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/admins/residents/:id/approve",
			schema: {
				tags: ["Admins"],
				summary: "Approve resident",
				description:
					"Aprova um residente que está com status A_VALIDACAO, mudando para ATIVO",
				...this.adminSchema.approveResident,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.authorize([UserTypeEnum.ADMIN]),
			],
			handler: this.adminController.approveResident.bind(
				this.adminController,
			) as RouteHandlerMethod,
		};
	};

	private rejectResident = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/admins/residents/:id/reject",
			schema: {
				tags: ["Admins"],
				summary: "Reject resident",
				description:
					"Rejeita um residente que está com status A_VALIDACAO, mudando para REJEITADO",
				...this.adminSchema.rejectResident,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.authorize([UserTypeEnum.ADMIN]),
			],
			handler: this.adminController.rejectResident.bind(
				this.adminController,
			) as RouteHandlerMethod,
		};
	};

	private deactivateResident = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/admins/residents/:id/deactivate",
			schema: {
				tags: ["Admins"],
				summary: "Deactivate resident",
				description:
					"Inativa um residente que está com status ATIVO, mudando para INATIVO",
				...this.adminSchema.deactivateResident,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.authorize([UserTypeEnum.ADMIN]),
			],
			handler: this.adminController.deactivateResident.bind(
				this.adminController,
			) as RouteHandlerMethod,
		};
	};

	private activateResident = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/admins/residents/:id/activate",
			schema: {
				tags: ["Admins"],
				summary: "Activate resident",
				description:
					"Ativa um residente que está com status INATIVO, mudando para ATIVO",
				...this.adminSchema.activateResident,
			},
			preHandler: [
				this.authMiddleware.authenticate,
				this.authMiddleware.authorize([UserTypeEnum.ADMIN]),
			],
			handler: this.adminController.activateResident.bind(
				this.adminController,
			) as RouteHandlerMethod,
		};
	};

	public routes = (): RouteOptions[] => {
		return [
			this.getById(),
			this.getMe(),
			this.update(),
			this.remove(),
			this.confirm(),
			this.forgetPassword(),
			this.resetPassword(),
			this.changePassword(),
			this.getResidents(),
			this.countResidents(),
			this.getResidentById(),
			this.approveResident(),
			this.rejectResident(),
			this.deactivateResident(),
			this.activateResident(),
		];
	};
}
