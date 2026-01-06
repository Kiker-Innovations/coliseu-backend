import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { ResidentController } from "./resident.controller";
import { ResidentSchema } from "./resident.schema";

export class ResidentRouteV1 {
	private residentController: ResidentController;
	private residentSchema: ResidentSchema;

	constructor(mongoClient: MongoClient) {
		this.residentController = new ResidentController(mongoClient);
		this.residentSchema = new ResidentSchema();
	}

	private create = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/residents",
			schema: {
				tags: ["Residents"],
				summary: "Create a new resident",
				description:
					"Cria um novo morador no sistema e envia email de confirmação",
				...this.residentSchema.create,
			},
			handler: this.residentController.createResident.bind(
				this.residentController,
			) as RouteHandlerMethod,
		};
	};

	private getById = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/residents/:id",
			schema: {
				tags: ["Residents"],
				summary: "Get resident by ID",
				description: "Busca um morador específico por ID",
				...this.residentSchema.getById,
			},
			handler: this.residentController.getResident.bind(
				this.residentController,
			) as RouteHandlerMethod,
		};
	};

	private getMe = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/residents/me",
			schema: {
				tags: ["Residents"],
				summary: "Get current resident profile",
				description: "Busca o perfil do morador autenticado",
				...this.residentSchema.getMe, // Schema específico sem params
			},
			handler: this.residentController.getCurrentResident.bind(
				this.residentController,
			) as RouteHandlerMethod,
		};
	};

	private update = (): RouteOptions => {
		return {
			method: "PUT",
			url: "/v1/residents/:id",
			schema: {
				tags: ["Residents"],
				summary: "Update resident",
				description: "Atualiza dados de um morador (phone, photoUrl)",
				...this.residentSchema.update,
			},
			handler: this.residentController.updateResident.bind(
				this.residentController,
			) as RouteHandlerMethod,
		};
	};

	private remove = (): RouteOptions => {
		return {
			method: "DELETE",
			url: "/v1/residents/:id",
			schema: {
				tags: ["Residents"],
				summary: "Delete resident",
				description: "Remove um morador do sistema",
				...this.residentSchema.remove,
			},
			handler: this.residentController.deleteResident.bind(
				this.residentController,
			) as RouteHandlerMethod,
		};
	};

	private confirm = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/residents/confirm",
			schema: {
				tags: ["Residents"],
				summary: "Confirm resident email",
				description: "Confirma o código de verificação enviado por email",
				...this.residentSchema.confirm,
			},
			handler: this.residentController.confirmResident.bind(
				this.residentController,
			) as RouteHandlerMethod,
		};
	};

	private forgetPassword = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/residents/forget-password",
			schema: {
				tags: ["Residents"],
				summary: "Request password reset",
				description:
					"Solicita recuperação de senha. Um código de 6 dígitos será enviado por email (válido por 15 minutos)",
				...this.residentSchema.forgetPassword,
			},
			handler: this.residentController.forgetPassword.bind(
				this.residentController,
			) as RouteHandlerMethod,
		};
	};

	private resetPassword = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/residents/reset-password",
			schema: {
				tags: ["Residents"],
				summary: "Reset password with code",
				description:
					"Redefine a senha usando o código de recuperação recebido por email",
				...this.residentSchema.resetPassword,
			},
			handler: this.residentController.resetPassword.bind(
				this.residentController,
			) as RouteHandlerMethod,
		};
	};

	private getStatus = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/residents/status",
			schema: {
				tags: ["Residents"],
				summary: "Get resident status by email",
				description:
					"Busca o status e dados básicos do morador por email (público)",
				...this.residentSchema.getStatus,
			},
			handler: this.residentController.getResidentStatus.bind(
				this.residentController,
			) as RouteHandlerMethod,
		};
	};

	private resendConfirmationEmail = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/residents/resend-confirmation-email",
			schema: {
				tags: ["Residents"],
				summary: "Resend confirmation email",
				description:
					"Reenvia o email de confirmação para moradores com status A_CONFIRMACAO_EMAIL (público)",
				...this.residentSchema.resendConfirmationEmail,
			},
			handler: this.residentController.resendConfirmationEmail.bind(
				this.residentController,
			) as RouteHandlerMethod,
		};
	};

	private updateRejectedResident = (): RouteOptions => {
		return {
			method: "PUT",
			url: "/v1/residents/update-rejected",
			schema: {
				tags: ["Residents"],
				summary: "Update rejected resident",
				description:
					"Atualiza dados de um residente rejeitado e muda status para A_VALIDACAO (público)",
				...this.residentSchema.updateRejectedResident,
			},
			handler: this.residentController.updateRejectedResident.bind(
				this.residentController,
			) as RouteHandlerMethod,
		};
	};

	private generatePresignedUrlForPhoto = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/residents/:id/photo/presigned-url",
			schema: {
				tags: ["Residents"],
				summary: "Generate presigned URL for photo upload",
				description: "Gera uma URL pré-assinada para upload de foto do morador",
				...this.residentSchema.generatePresignedUrl,
			},
			handler: this.residentController.generatePresignedUrlForPhoto.bind(
				this.residentController,
			) as RouteHandlerMethod,
		};
	};

	private changePassword = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/residents/me/password",
			schema: {
				tags: ["Residents"],
				summary: "Change resident password",
				description: "Altera a senha do morador autenticado",
				...this.residentSchema.changePassword,
			},
			handler: this.residentController.changePassword.bind(
				this.residentController,
			) as RouteHandlerMethod,
		};
	};

	public routes = (): RouteOptions[] => {
		return [
			this.create(),
			this.getById(),
			this.getMe(),
			this.update(),
			this.remove(),
			this.confirm(),
			this.forgetPassword(),
			this.resetPassword(),
			this.getStatus(),
			this.resendConfirmationEmail(),
			this.updateRejectedResident(),
			this.generatePresignedUrlForPhoto(),
			this.changePassword(),
		];
	};
}
