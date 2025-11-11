import type { MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
	CreateAdminEntity,
	AdminEntity,
} from "../../../database/mongodb/entity/admin.entity";
import { AdminRepository } from "../../../database/mongodb/repositories/admin.repository";
import type {
	AdminConfirmDto,
	AdminCreateDto,
	AdminUpdateDto,
	AdminForgetPasswordDto,
	AdminResetPasswordDto,
} from "./dto";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";
import {
	hashPassword,
	generateCode,
	generateResetCode,
} from "../../utils/cryptoHelper";
import { AdminEmail } from "./admin.emails";
import { sendPasswordResetEmail } from "@/v1/utils/emailHelper";
import { getDate } from "@/v1/utils/utils";
import { AdminStatusEnum } from "../../enum/adminStatus.enum";

export class AdminService {
	private adminRepository: AdminRepository;

	constructor(mongoClient: MongoClient) {
		this.adminRepository = new AdminRepository(mongoClient);
	}

	public async createAdmin(adminCreateDto: AdminCreateDto): Promise<
		HttpResponse<{
			name: string;
			email: string;
		}>
	> {
		const existingAdmin = await this.adminRepository.findByEmail(
			adminCreateDto.email,
		);

		if (existingAdmin) {
			throw httpException(
				"Email já cadastrado no sistema.",
				httpStatus.CONFLICT,
			);
		}

		const passwordHash = await hashPassword(adminCreateDto.password);
		const adminCode = await generateCode();

		const adminEntity: CreateAdminEntity = {
			name: adminCreateDto.name,
			email: adminCreateDto.email,
			passwordHash,
			status: AdminStatusEnum.INATIVO,
			adminCode,
		};

		const createdAdmin = await this.adminRepository.create(adminEntity);

		const adminEmail = new AdminEmail();
		adminEmail.sendConfirmationEmailAsync(
			createdAdmin.email,
			createdAdmin.name,
			adminCode,
		);

		return {
			success: true,
			message:
				"Administrador cadastrado com sucesso! Verifique seu email para confirmar o cadastro.",
			data: {
				name: createdAdmin.name,
				email: createdAdmin.email,
			},
		};
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

		const updatedAdmin = await this.adminRepository.update(
			adminId,
			adminUpdateDto,
		);

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
}

