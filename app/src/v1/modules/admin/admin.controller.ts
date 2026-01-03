import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import {
	transformConfirmAdminDto,
	transformCreateAdminDto,
	transformUpdateAdminDto,
	transformForgetPasswordAdminDto,
	transformResetPasswordAdminDto,
} from "./dto";
import { AdminService } from "./admin.service";
import { httpException } from "../../../config/error";
import { UserTypeEnum } from "../../enum/userType.enum";

export class AdminController {
	private adminService: AdminService;

	constructor(mongoClient: MongoClient) {
		this.adminService = new AdminService(mongoClient);
	}

	public async createAdmin(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		return reply
			.code(httpStatus.CREATED)
			.send(
				await this.adminService.createAdmin(
					transformCreateAdminDto(request.body),
				),
			);
	}

	public async getAdmin(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const { id } = request.params as { id: string };
		return reply
			.status(httpStatus.OK)
			.send(await this.adminService.getAdmin(id));
	}

	public async updateAdmin(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const { id } = request.params as { id: string };
		return reply
			.status(httpStatus.OK)
			.send(
				await this.adminService.updateAdmin(
					id,
					transformUpdateAdminDto(request.body),
				),
			);
	}

	public async deleteAdmin(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const { id } = request.params as { id: string };
		return reply
			.status(httpStatus.OK)
			.send(await this.adminService.deleteAdmin(id));
	}

	public async confirmAdmin(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		return reply
			.status(httpStatus.OK)
			.send(
				await this.adminService.confirmAdminCode(
					transformConfirmAdminDto(request.body),
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
				await this.adminService.forgetPassword(
					transformForgetPasswordAdminDto(request.body),
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
				await this.adminService.resetPassword(
					transformResetPasswordAdminDto(request.body),
				),
			);
	}

	public async getResidents(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const buildingId = request.user?.buildingId;
		const { page, limit, search, filterBy, status } = request.query as {
			page?: string;
			limit?: string;
			search?: string;
			filterBy?: "name" | "phone" | "email" | "apartment";
			status?: "A_CONFIRMACAO_EMAIL" | "A_VALIDACAO" | "REJEITADO" | "INATIVO" | "ATIVO";
		};

		return reply
			.status(httpStatus.OK)
			.send(
				await this.adminService.getResidents(
					buildingId,
					{
						page: page ? Number(page) : undefined,
						limit: limit ? Number(limit) : undefined,
						search,
						filterBy,
						status,
					},
				),
			);
	}

	public async countResidents(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		try {
			const buildingId = request.user?.buildingId;

			if (!buildingId) {
				return reply.status(httpStatus.BAD_REQUEST).send({
					success: false,
					message: "ID do edifício não encontrado no token",
				});
			}

			const result = await this.adminService.countResidentsByBuilding(buildingId);

			return reply.status(httpStatus.OK).send(result);
		} catch (error: any) {
			if (error.statusCode) {
				return reply.status(error.statusCode).send({
					success: false,
					message: error.message,
				});
			}
			console.error("Erro ao contar residentes:", error);
			return reply.status(httpStatus.INTERNAL_SERVER_ERROR).send({
				success: false,
				message: "Erro interno do servidor ao contar residentes",
			});
		}
	}

	public async getResidentById(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		try {
			const { id } = request.params as { id: string };
			const buildingId = request.user?.buildingId;

			if (!buildingId) {
				return reply.status(httpStatus.BAD_REQUEST).send({
					success: false,
					message: "ID do edifício não encontrado no token",
				});
			}

			if (!id) {
				return reply.status(httpStatus.BAD_REQUEST).send({
					success: false,
					message: "ID do residente é obrigatório",
				});
			}

			const result = await this.adminService.getResidentById(id, buildingId);

			return reply.status(httpStatus.OK).send(result);
		} catch (error: any) {
			if (error.statusCode) {
				return reply.status(error.statusCode).send({
					success: false,
					message: error.message,
				});
			}
			console.error("Erro ao buscar residente:", error);
			return reply.status(httpStatus.INTERNAL_SERVER_ERROR).send({
				success: false,
				message: "Erro interno do servidor ao buscar residente",
			});
		}
	}

	public async approveResident(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		try {
			if (request.user?.userType !== UserTypeEnum.ADMIN) {
				throw httpException(
					"Apenas administradores podem aprovar residentes",
					httpStatus.FORBIDDEN,
				);
			}

			const { id } = request.params as { id: string };
			const buildingId = request.user?.buildingId;

			if (!buildingId) {
				return reply.status(httpStatus.BAD_REQUEST).send({
					success: false,
					message: "ID do edifício não encontrado no token",
				});
			}

			if (!id) {
				return reply.status(httpStatus.BAD_REQUEST).send({
					success: false,
					message: "ID do residente é obrigatório",
				});
			}

			const result = await this.adminService.approveResident(id, buildingId);

			return reply.status(httpStatus.OK).send(result);
		} catch (error: any) {
			if (error.statusCode) {
				return reply.status(error.statusCode).send({
					success: false,
					message: error.message,
				});
			}
			console.error("Erro ao aprovar residente:", error);
			return reply.status(httpStatus.INTERNAL_SERVER_ERROR).send({
				success: false,
				message: "Erro interno do servidor ao aprovar residente",
			});
		}
	}

	public async rejectResident(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		try {
			if (request.user?.userType !== UserTypeEnum.ADMIN) {
				throw httpException(
					"Apenas administradores podem rejeitar residentes",
					httpStatus.FORBIDDEN,
				);
			}

			const { id } = request.params as { id: string };
			const { rejectType, rejectNote } = request.body as {
				rejectType: string;
				rejectNote?: string;
			};
			const buildingId = request.user?.buildingId;

			if (!buildingId) {
				return reply.status(httpStatus.BAD_REQUEST).send({
					success: false,
					message: "ID do edifício não encontrado no token",
				});
			}

			if (!id) {
				return reply.status(httpStatus.BAD_REQUEST).send({
					success: false,
					message: "ID do residente é obrigatório",
				});
			}

			if (!rejectType) {
				return reply.status(httpStatus.BAD_REQUEST).send({
					success: false,
					message: "Tipo de rejeição é obrigatório",
				});
			}

			const result = await this.adminService.rejectResident(
				id,
				buildingId,
				rejectType,
				rejectNote,
			);

			return reply.status(httpStatus.OK).send(result);
		} catch (error: any) {
			if (error.statusCode) {
				return reply.status(error.statusCode).send({
					success: false,
					message: error.message,
				});
			}
			console.error("Erro ao rejeitar residente:", error);
			return reply.status(httpStatus.INTERNAL_SERVER_ERROR).send({
				success: false,
				message: "Erro interno do servidor ao rejeitar residente",
			});
		}
	}

	public async deactivateResident(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		try {
			if (request.user?.userType !== UserTypeEnum.ADMIN) {
				throw httpException(
					"Apenas administradores podem inativar residentes",
					httpStatus.FORBIDDEN,
				);
			}

			const { id } = request.params as { id: string };
			const { inactiveType, inactiveNote } = request.body as {
				inactiveType: string;
				inactiveNote?: string;
			};
			const buildingId = request.user?.buildingId;

			if (!buildingId) {
				return reply.status(httpStatus.BAD_REQUEST).send({
					success: false,
					message: "ID do edifício não encontrado no token",
				});
			}

			if (!id) {
				return reply.status(httpStatus.BAD_REQUEST).send({
					success: false,
					message: "ID do residente é obrigatório",
				});
			}

			if (!inactiveType) {
				return reply.status(httpStatus.BAD_REQUEST).send({
					success: false,
					message: "Tipo de inativação é obrigatório",
				});
			}

			const result = await this.adminService.deactivateResident(
				id,
				buildingId,
				inactiveType,
				inactiveNote,
			);

			return reply.status(httpStatus.OK).send(result);
		} catch (error: any) {
			if (error.statusCode) {
				return reply.status(error.statusCode).send({
					success: false,
					message: error.message,
				});
			}
			console.error("Erro ao inativar residente:", error);
			return reply.status(httpStatus.INTERNAL_SERVER_ERROR).send({
				success: false,
				message: "Erro interno do servidor ao inativar residente",
			});
		}
	}

	public async activateResident(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		try {
			if (request.user?.userType !== UserTypeEnum.ADMIN) {
				throw httpException(
					"Apenas administradores podem ativar residentes",
					httpStatus.FORBIDDEN,
				);
			}

			const { id } = request.params as { id: string };
			const buildingId = request.user?.buildingId;

			if (!buildingId) {
				return reply.status(httpStatus.BAD_REQUEST).send({
					success: false,
					message: "ID do edifício não encontrado no token",
				});
			}

			if (!id) {
				return reply.status(httpStatus.BAD_REQUEST).send({
					success: false,
					message: "ID do residente é obrigatório",
				});
			}

			const result = await this.adminService.activateResident(id, buildingId);

			return reply.status(httpStatus.OK).send(result);
		} catch (error: any) {
			if (error.statusCode) {
				return reply.status(error.statusCode).send({
					success: false,
					message: error.message,
				});
			}
			console.error("Erro ao ativar residente:", error);
			return reply.status(httpStatus.INTERNAL_SERVER_ERROR).send({
				success: false,
				message: "Erro interno do servidor ao ativar residente",
			});
		}
	}
}

