import type { MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type { AdminEntity } from "../../../database/mongodb/entity/admin.entity";
import { AdminRepository } from "../../../database/mongodb/repositories/admin.repository";
import { ResidentRepository } from "../../../database/mongodb/repositories/resident.repository";
import { ApartmentRepository } from "../../../database/mongodb/repositories/apartment.repository";
import { BuildingRepository } from "../../../database/mongodb/repositories/building.repository";
import type {
	AdminConfirmDto,
	AdminUpdateDto,
	AdminForgetPasswordDto,
	AdminResetPasswordDto,
	AdminChangePasswordDto,
} from "./dto";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";
import { hashPassword, generateResetCode } from "../../utils/cryptoHelper";
import { sendPasswordResetEmail } from "@/v1/utils/emailHelper";
import { getDate } from "@/v1/utils/utils";
import { AdminStatusEnum } from "../../enum/adminStatus.enum";
import { ResidentStatusEnum } from "../../enum/residentStatus.enum";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { sqsClient, QUEUE_URL } from "../../../sqs";

export class AdminService {
	private adminRepository: AdminRepository;
	private residentRepository: ResidentRepository;
	private apartmentRepository: ApartmentRepository;
	private buildingRepository: BuildingRepository;

	constructor(mongoClient: MongoClient) {
		this.adminRepository = new AdminRepository(mongoClient);
		this.residentRepository = new ResidentRepository(mongoClient);
		this.apartmentRepository = new ApartmentRepository(mongoClient);
		this.buildingRepository = new BuildingRepository(mongoClient);
	}

	public async getAdmin(adminId: string): Promise<
		HttpResponse<{
			name: string;
			email: string;
			status: string;
		}>
	> {
		const admin = await this.adminRepository.findById(adminId);

		if (!admin) {
			throw httpException("Administrador não encontrado", httpStatus.NOT_FOUND);
		}

		return {
			success: true,
			message: "Administrador encontrado com sucesso",
			data: {
				name: admin.name,
				email: admin.email,
				status: admin.status,
			},
		};
	}

	public async sendMessageToQueue(data: any): Promise<HttpResponse<{ messageId: string | undefined }>> {
        try {
            const command = new SendMessageCommand({
                QueueUrl: QUEUE_URL,
                MessageBody: JSON.stringify(data),
            });

            const result = await sqsClient.send(command);

            return {
                success: true,
                message: "Mensagem enviada para a fila com sucesso",
                data: {
                    messageId: result.MessageId,
                },
            };
        } catch (error) {
            // Segue o seu padrão de erro
            throw httpException("Erro ao enviar mensagem para o SQS", httpStatus.INTERNAL_SERVER_ERROR);
        }
    }

	public async getCurrentAdmin(adminId: string): Promise<
		HttpResponse<{
			id: string;
			email: string;
			name: string;
			buildingName?: string;
			buildingId?: string;
		}>
	> {
		const admin = await this.adminRepository.findById(adminId);

		if (!admin) {
			throw httpException("Administrador não encontrado", httpStatus.NOT_FOUND);
		}

		const building = await this.buildingRepository.findById(admin.buildingId);

		return {
			success: true,
			message: "Perfil do administrador encontrado",
			data: {
				id: admin._id,
				email: admin.email,
				name: admin.name,
				buildingName: building?.name,
				buildingId: admin.buildingId,
			},
		};
	}

	public async getAdminByEmail(email: string): Promise<AdminEntity | null> {
		return await this.adminRepository.findByEmail(email);
	}

	public async updateAdmin(
		adminId: string,
		adminUpdateDto: AdminUpdateDto,
	): Promise<
		HttpResponse<{
			name: string;
			email: string;
			status: string;
		}>
	> {
		const admin = await this.adminRepository.findById(adminId);

		if (!admin) {
			throw httpException("Administrador não encontrado", httpStatus.NOT_FOUND);
		}

		const updateData: any = {};

		if (adminUpdateDto.name) {
			updateData.name = adminUpdateDto.name;
		}

		if (adminUpdateDto.email) {
			updateData.email = adminUpdateDto.email;
		}

		if (adminUpdateDto.buildingId) {
			updateData.buildingId = adminUpdateDto.buildingId;
		}

		const updatedAdmin = await this.adminRepository.update(adminId, updateData);

		if (!updatedAdmin) {
			throw httpException(
				"Erro ao atualizar administrador",
				httpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		return {
			success: true,
			message: "Administrador atualizado com sucesso",
			data: {
				name: updatedAdmin.name,
				email: updatedAdmin.email,
				status: updatedAdmin.status,
			},
		};
	}

	public async deleteAdmin(adminId: string): Promise<HttpResponse<null>> {
		const admin = await this.adminRepository.findById(adminId);

		if (!admin) {
			throw httpException("Administrador não encontrado", httpStatus.NOT_FOUND);
		}

		const deleted = await this.adminRepository.delete(adminId);

		if (!deleted) {
			throw httpException(
				"Erro ao deletar administrador",
				httpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		return {
			success: true,
			message: "Administrador deletado com sucesso",
			data: null,
		};
	}

	public async confirmAdminCode(
		adminConfirmDto: AdminConfirmDto,
	): Promise<HttpResponse<null>> {
		const admin = await this.getAdminByEmail(adminConfirmDto.email);

		if (!admin) {
			throw httpException("Administrador não encontrado", httpStatus.NOT_FOUND);
		}

		if (admin.status === AdminStatusEnum.ATIVO) {
			throw httpException(
				"Cadastro já foi confirmado anteriormente",
				httpStatus.BAD_REQUEST,
			);
		}

		if (admin.adminCode !== adminConfirmDto.code) {
			throw httpException(
				"Código de confirmação inválido",
				httpStatus.BAD_REQUEST,
			);
		}

		await this.adminRepository.updateByEmail(adminConfirmDto.email, {
			status: AdminStatusEnum.ATIVO,
		});

		return {
			success: true,
			message: "Cadastro confirmado com sucesso!",
			data: null,
		};
	}

	public async forgetPassword(
		forgetPasswordDto: AdminForgetPasswordDto,
	): Promise<HttpResponse<null>> {
		const admin = await this.adminRepository.findByEmail(
			forgetPasswordDto.email,
		);

		if (!admin) {
			throw httpException("Email não encontrado", httpStatus.NOT_FOUND);
		}

		const resetCode = generateResetCode();
		const resetTokenExpiry = getDate();
		resetTokenExpiry.setMinutes(resetTokenExpiry.getMinutes() + 15); // Expira em 15 minutos

		await this.adminRepository.update(admin._id, {
			resetPasswordToken: resetCode,
			resetPasswordTokenExpiry: resetTokenExpiry,
		});

		sendPasswordResetEmail(
			admin.email,
			admin.name,
			resetCode,
			`https://coliseucondo.com.br/admin/reset-password?email=${admin.email}`,
		);

		return {
			success: true,
			message:
				"Código de recuperação enviado para seu email. Verifique sua caixa de entrada.",
			data: null,
		};
	}

	public async resetPassword(
		resetPasswordDto: AdminResetPasswordDto,
	): Promise<HttpResponse<null>> {
		const admin = await this.adminRepository.findByEmail(
			resetPasswordDto.email,
		);

		if (!admin) {
			throw httpException("Email não encontrado", httpStatus.NOT_FOUND);
		}

		if (!admin.resetPasswordToken || !admin.resetPasswordTokenExpiry) {
			throw httpException(
				"Nenhuma solicitação de recuperação de senha encontrada",
				httpStatus.BAD_REQUEST,
			);
		}

		if (admin.resetPasswordToken !== resetPasswordDto.code) {
			throw httpException(
				"Código de recuperação inválido",
				httpStatus.BAD_REQUEST,
			);
		}

		const now = getDate();
		if (now > admin.resetPasswordTokenExpiry) {
			throw httpException(
				"Código de recuperação expirado. Solicite um novo código.",
				httpStatus.BAD_REQUEST,
			);
		}

		const newPasswordHash = await hashPassword(resetPasswordDto.newPassword);

		await this.adminRepository.update(admin._id, {
			passwordHash: newPasswordHash,
			resetPasswordToken: undefined,
			resetPasswordTokenExpiry: undefined,
		});

		return {
			success: true,
			message: "Senha redefinida com sucesso! Você já pode fazer login.",
			data: null,
		};
	}

	public async getResidents(
		buildingId: string,
		params?: {
			page?: number;
			limit?: number;
			search?: string;
			filterBy?: "name" | "phone" | "email" | "apartment";
			status?:
				| "A_CONFIRMACAO_EMAIL"
				| "A_VALIDACAO"
				| "REJEITADO"
				| "INATIVO"
				| "ATIVO";
		},
	): Promise<
		HttpResponse<{
			data: Array<{
				_id: string;
				name: string;
				email: string;
				phone?: string;
				apartmentId?: string;
				apartmentNumber?: string;
				status: string;
			}>;
			total: number;
			totalPages: number;
		}>
	> {
		const residents = await this.residentRepository.findManyWithApartments(
			buildingId,
			params,
		);

		const total = residents.length;
		const page = params?.page || 1;
		const limit = params?.limit || 10;
		const skip = (page - 1) * limit;
		const paginatedResidents = residents.slice(skip, skip + limit);

		return {
			success: true,
			message: "Residentes encontrados",
			data: {
				data: paginatedResidents,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	public async countResidentsByBuilding(
		buildingId: string,
	): Promise<HttpResponse<number>> {
		if (!buildingId) {
			throw httpException(
				"ID do edifício é obrigatório",
				httpStatus.BAD_REQUEST,
			);
		}

		const count = await this.residentRepository.countByBuildingId(buildingId);

		return {
			success: true,
			message: "Contagem de residentes realizada com sucesso",
			data: count,
		};
	}

	public async getResidentById(
		residentId: string,
		buildingId: string,
	): Promise<
		HttpResponse<{
			_id: string;
			name: string;
			email: string;
			phone: string;
			buildingId: string;
			apartmentId: string;
			status: string;
			residentCode: string;
			createdAt: string;
			updatedAt: string;
			apartment: {
				_id: string;
				number: string;
				block: string;
				floor: number;
				status: string;
			} | null;
		}>
	> {
		if (!residentId) {
			throw httpException(
				"ID do residente é obrigatório",
				httpStatus.BAD_REQUEST,
			);
		}

		if (!buildingId) {
			throw httpException(
				"ID do edifício é obrigatório",
				httpStatus.BAD_REQUEST,
			);
		}

		const resident = await this.residentRepository.findByIdWithApartment(
			residentId,
			buildingId,
		);

		if (!resident) {
			throw httpException("Residente não encontrado", httpStatus.NOT_FOUND);
		}

		return {
			success: true,
			message: "Residente encontrado com sucesso",
			data: resident,
		};
	}

	public async approveResident(
		residentId: string,
		buildingId: string,
	): Promise<
		HttpResponse<{
			_id: string;
			name: string;
			email: string;
			status: string;
		}>
	> {
		if (!residentId) {
			throw httpException(
				"ID do residente é obrigatório",
				httpStatus.BAD_REQUEST,
			);
		}

		if (!buildingId) {
			throw httpException(
				"ID do edifício é obrigatório",
				httpStatus.BAD_REQUEST,
			);
		}

		// Buscar residente
		const resident = await this.residentRepository.findById(residentId);

		if (!resident) {
			throw httpException("Residente não encontrado", httpStatus.NOT_FOUND);
		}

		// Verificar se o residente pertence ao building
		if (resident.buildingId !== buildingId) {
			throw httpException(
				"Residente não pertence ao edifício do administrador",
				httpStatus.FORBIDDEN,
			);
		}

		// Verificar se o status é A_VALIDACAO
		if (resident.status !== ResidentStatusEnum.A_VALIDACAO) {
			throw httpException(
				`Residente não está aguardando aprovação. Status atual: ${resident.status}`,
				httpStatus.BAD_REQUEST,
			);
		}

		// Atualizar status para ATIVO e registrar data de ativação
		const updatedResident = await this.residentRepository.update(residentId, {
			status: ResidentStatusEnum.ATIVO,
			activatedAt: new Date(),
		});

		if (!updatedResident) {
			throw httpException(
				"Erro ao atualizar status do residente",
				httpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		return {
			success: true,
			message: "Residente aprovado com sucesso",
			data: {
				_id: updatedResident._id,
				name: updatedResident.name,
				email: updatedResident.email,
				status: updatedResident.status,
			},
		};
	}

	public async rejectResident(
		residentId: string,
		buildingId: string,
		rejectType: string,
		rejectNote?: string,
	): Promise<
		HttpResponse<{
			_id: string;
			name: string;
			email: string;
			status: string;
			rejectType: string;
			rejectNote?: string;
		}>
	> {
		if (!residentId) {
			throw httpException(
				"ID do residente é obrigatório",
				httpStatus.BAD_REQUEST,
			);
		}

		if (!buildingId) {
			throw httpException(
				"ID do edifício é obrigatório",
				httpStatus.BAD_REQUEST,
			);
		}

		if (!rejectType) {
			throw httpException(
				"Tipo de rejeição é obrigatório",
				httpStatus.BAD_REQUEST,
			);
		}

		// Buscar residente
		const resident = await this.residentRepository.findById(residentId);

		if (!resident) {
			throw httpException("Residente não encontrado", httpStatus.NOT_FOUND);
		}

		// Verificar se o residente pertence ao building
		if (resident.buildingId !== buildingId) {
			throw httpException(
				"Residente não pertence ao edifício do administrador",
				httpStatus.FORBIDDEN,
			);
		}

		// Verificar se o status é A_VALIDACAO
		if (resident.status !== ResidentStatusEnum.A_VALIDACAO) {
			throw httpException(
				`Residente não está aguardando aprovação. Status atual: ${resident.status}`,
				httpStatus.BAD_REQUEST,
			);
		}

		// Atualizar status para REJEITADO e salvar dados de rejeição
		const updatedResident = await this.residentRepository.update(residentId, {
			status: ResidentStatusEnum.REJEITADO,
			rejectType: rejectType as any,
			rejectNote: rejectNote || undefined,
			rejectedAt: new Date(),
		});

		if (!updatedResident) {
			throw httpException(
				"Erro ao atualizar status do residente",
				httpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		return {
			success: true,
			message: "Residente rejeitado com sucesso",
			data: {
				_id: updatedResident._id,
				name: updatedResident.name,
				email: updatedResident.email,
				status: updatedResident.status,
				rejectType: rejectType,
				rejectNote: rejectNote,
			},
		};
	}

	public async deactivateResident(
		residentId: string,
		buildingId: string,
		inactiveType: string,
		inactiveNote?: string,
	): Promise<
		HttpResponse<{
			_id: string;
			name: string;
			email: string;
			status: string;
		}>
	> {
		if (!residentId) {
			throw httpException(
				"ID do residente é obrigatório",
				httpStatus.BAD_REQUEST,
			);
		}

		if (!buildingId) {
			throw httpException(
				"ID do edifício é obrigatório",
				httpStatus.BAD_REQUEST,
			);
		}

		if (!inactiveType) {
			throw httpException(
				"Tipo de inativação é obrigatório",
				httpStatus.BAD_REQUEST,
			);
		}

		const resident = await this.residentRepository.findById(residentId);

		if (!resident || resident.buildingId !== buildingId) {
			throw httpException("Residente não encontrado", httpStatus.NOT_FOUND);
		}

		if (resident.status !== ResidentStatusEnum.ATIVO) {
			throw httpException(
				"Residente não está ativo para ser inativado",
				httpStatus.BAD_REQUEST,
			);
		}

		const updatedResident = await this.residentRepository.update(residentId, {
			status: ResidentStatusEnum.INATIVO,
			inactiveType: inactiveType as any,
			inactiveNote: inactiveNote || undefined,
			inactivatedAt: new Date(),
		});

		if (!updatedResident) {
			throw httpException(
				"Erro ao atualizar status do residente",
				httpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		return {
			success: true,
			message: "Residente inativado com sucesso",
			data: {
				_id: updatedResident._id,
				name: updatedResident.name,
				email: updatedResident.email,
				status: updatedResident.status,
			},
		};
	}

	public async activateResident(
		residentId: string,
		buildingId: string,
	): Promise<
		HttpResponse<{
			_id: string;
			name: string;
			email: string;
			status: string;
		}>
	> {
		if (!residentId) {
			throw httpException(
				"ID do residente é obrigatório",
				httpStatus.BAD_REQUEST,
			);
		}

		if (!buildingId) {
			throw httpException(
				"ID do edifício é obrigatório",
				httpStatus.BAD_REQUEST,
			);
		}

		const resident = await this.residentRepository.findById(residentId);

		if (!resident || resident.buildingId !== buildingId) {
			throw httpException("Residente não encontrado", httpStatus.NOT_FOUND);
		}

		if (resident.status !== ResidentStatusEnum.INATIVO) {
			throw httpException(
				"Residente não está inativo para ser ativado",
				httpStatus.BAD_REQUEST,
			);
		}

		const updatedResident = await this.residentRepository.update(residentId, {
			status: ResidentStatusEnum.ATIVO,
			inactiveType: undefined,
			inactiveNote: undefined,
			activatedAt: new Date(),
		});

		// Limpar campos de inativação usando $unset
		if (updatedResident) {
			await this.residentRepository.removeInactiveFields(residentId);
		}

		if (!updatedResident) {
			throw httpException(
				"Erro ao atualizar status do residente",
				httpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		return {
			success: true,
			message: "Residente ativado com sucesso",
			data: {
				_id: updatedResident._id,
				name: updatedResident.name,
				email: updatedResident.email,
				status: updatedResident.status,
			},
		};
	}

	public async changePassword(
		adminId: string,
		changePasswordDto: AdminChangePasswordDto,
	): Promise<HttpResponse<null>> {
		const admin = await this.adminRepository.findById(adminId);

		if (!admin) {
			throw httpException("Administrador não encontrado", httpStatus.NOT_FOUND);
		}

		// Verificar se a senha atual está correta
		const isCurrentPasswordValid = await this.comparePassword(
			changePasswordDto.currentPassword,
			admin.passwordHash,
		);

		if (!isCurrentPasswordValid) {
			throw httpException("Senha atual incorreta", httpStatus.UNAUTHORIZED);
		}

		// Hash da nova senha
		const newPasswordHash = await hashPassword(changePasswordDto.newPassword);

		// Atualizar senha
		await this.adminRepository.update(admin._id, {
			passwordHash: newPasswordHash,
		});

		return {
			success: true,
			message: "Senha alterada com sucesso",
			data: null,
		};
	}

	private async comparePassword(
		password: string,
		hash: string,
	): Promise<boolean> {
		const bcrypt = await import("bcrypt");
		return await bcrypt.compare(password, hash);
	}
}
