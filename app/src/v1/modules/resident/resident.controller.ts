import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import {
	transformConfirmResidentDto,
	transformCreateResidentDto,
	transformUpdateResidentDto,
	transformForgetPasswordResidentDto,
	transformResetPasswordResidentDto,
	transformChangePasswordResidentDto,
} from "./dto";
import { ResidentService } from "./resident.service";

export class ResidentController {
	private residentService: ResidentService;

	constructor(mongoClient: MongoClient) {
		this.residentService = new ResidentService(mongoClient);
	}

	public async createResident(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		return reply
			.code(httpStatus.CREATED)
			.send(
				await this.residentService.createResident(
					transformCreateResidentDto(request.body),
				),
			);
	}

	public async getResident(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const { id } = request.params as { id: string };
		return reply
			.status(httpStatus.OK)
			.send(await this.residentService.getResident(id));
	}

	public async getCurrentResident(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		try {
			const user = request.user as { userId: string };
			if (!user || !user.userId) {
				return reply.status(httpStatus.UNAUTHORIZED).send({
					success: false,
					message: "Usuário não autenticado",
				});
			}

			const result = await this.residentService.getCurrentResident(user.userId);
			return reply.status(httpStatus.OK).send(result);
		} catch (error: any) {
			if (error.statusCode) {
				return reply.status(error.statusCode).send({
					success: false,
					message: error.message,
				});
			}
			console.error("Erro ao buscar perfil do morador:", error);
			return reply.status(httpStatus.INTERNAL_SERVER_ERROR).send({
				success: false,
				message: "Erro interno do servidor",
			});
		}
	}

	public async updateResident(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const { id } = request.params as { id: string };
		return reply
			.status(httpStatus.OK)
			.send(
				await this.residentService.updateResident(
					id,
					transformUpdateResidentDto(request.body),
				),
			);
	}

	public async deleteResident(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const { id } = request.params as { id: string };
		return reply
			.status(httpStatus.OK)
			.send(await this.residentService.deleteResident(id));
	}

	public async confirmResident(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		return reply
			.status(httpStatus.OK)
			.send(
				await this.residentService.confirmResidentCode(
					transformConfirmResidentDto(request.body),
				),
			);
	}

	public async forgetPassword(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		return reply
			.status(httpStatus.OK)
			.send(
				await this.residentService.forgetPassword(
					transformForgetPasswordResidentDto(request.body),
				),
			);
	}

	public async resetPassword(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		return reply
			.status(httpStatus.OK)
			.send(
				await this.residentService.resetPassword(
					transformResetPasswordResidentDto(request.body),
				),
			);
	}

	public async getResidentStatus(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		try {
			const { email } = request.query as { email: string };

			if (!email) {
				return reply.status(httpStatus.BAD_REQUEST).send({
					success: false,
					message: "Email é obrigatório",
				});
			}

			const result = await this.residentService.getResidentStatusByEmail(email);

			return reply.status(httpStatus.OK).send(result);
		} catch (error: any) {
			if (error.statusCode) {
				return reply.status(error.statusCode).send({
					success: false,
					message: error.message,
				});
			}
			console.error("Erro ao buscar status do resident:", error);
			return reply.status(httpStatus.INTERNAL_SERVER_ERROR).send({
				success: false,
				message: "Erro interno do servidor",
			});
		}
	}

	public async resendConfirmationEmail(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		try {
			const { email } = request.body as { email: string };

			if (!email) {
				return reply.status(httpStatus.BAD_REQUEST).send({
					success: false,
					message: "Email é obrigatório",
				});
			}

			const result = await this.residentService.resendConfirmationEmail(email);

			return reply.status(httpStatus.OK).send(result);
		} catch (error: any) {
			if (error.statusCode) {
				return reply.status(error.statusCode).send({
					success: false,
					message: error.message,
				});
			}
			console.error("Erro ao reenviar email de confirmação:", error);
			return reply.status(httpStatus.INTERNAL_SERVER_ERROR).send({
				success: false,
				message: "Erro interno do servidor",
			});
		}
	}

	public async updateRejectedResident(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		try {
			const { email } = request.query as { email: string };

			if (!email) {
				return reply.status(httpStatus.BAD_REQUEST).send({
					success: false,
					message: "Email é obrigatório",
				});
			}

			const result = await this.residentService.updateRejectedResident(
				email,
				transformUpdateResidentDto(request.body),
			);

			return reply.status(httpStatus.OK).send(result);
		} catch (error: any) {
			if (error.statusCode) {
				return reply.status(error.statusCode).send({
					success: false,
					message: error.message,
				});
			}
			console.error("Erro ao atualizar residente rejeitado:", error);
			return reply.status(httpStatus.INTERNAL_SERVER_ERROR).send({
				success: false,
				message: "Erro interno do servidor",
			});
		}
	}

	public async generatePresignedUrlForPhoto(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		try {
			const { id } = request.params as { id: string };
			const body = request.body as { fileExtension?: string };
			const fileExtension = body.fileExtension || "jpg";

			const result = await this.residentService.generatePresignedUrlForPhoto(
				id,
				fileExtension,
			);

			return reply.status(httpStatus.OK).send(result);
		} catch (error: any) {
			if (error.statusCode) {
				return reply.status(error.statusCode).send({
					success: false,
					message: error.message,
				});
			}
			console.error("Erro ao gerar presigned URL:", error);
			return reply.status(httpStatus.INTERNAL_SERVER_ERROR).send({
				success: false,
				message: "Erro interno do servidor",
			});
		}
	}

	public async changePassword(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		try {
			const user = request.user as { userId: string };
			if (!user || !user.userId) {
				return reply.status(httpStatus.UNAUTHORIZED).send({
					success: false,
					message: "Usuário não autenticado",
				});
			}

			const result = await this.residentService.changePassword(
				user.userId,
				transformChangePasswordResidentDto(request.body),
			);

			return reply.status(httpStatus.OK).send(result);
		} catch (error: any) {
			if (error.statusCode) {
				return reply.status(error.statusCode).send({
					success: false,
					message: error.message,
				});
			}
			console.error("Erro ao alterar senha:", error);
			return reply.status(httpStatus.INTERNAL_SERVER_ERROR).send({
				success: false,
				message: "Erro interno do servidor",
			});
		}
	}
}
