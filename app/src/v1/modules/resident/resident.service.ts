import type { MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
	CreateResidentEntity,
	ResidentEntity,
} from "../../../database/mongodb/entity/resident.entity";
import { ResidentRepository } from "../../../database/mongodb/repositories/resident.repository";
import { RoleRepository } from "../../../database/mongodb/repositories/role.repository";
import { S3Provider } from "../../../providers/aws/s3.provider";
import { ResidentStatusEnum } from "../../enum/residentStatus.enum";
import type {
	ResidentConfirmDto,
	ResidentCreateDto,
	ResidentUpdateDto,
	ResidentForgetPasswordDto,
	ResidentResetPasswordDto,
	ResidentChangePasswordDto,
} from "./dto";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";
import {
	hashPassword,
	generateCode,
	generateResetCode,
} from "../../utils/cryptoHelper";
import { ResidentEmail } from "./resident.emails";
import { sendPasswordResetEmail } from "@/v1/utils/emailHelper";
import { getDate } from "@/v1/utils/utils";
import { ApartmentRepository } from "@/database/mongodb/repositories/apartment.repository";
import { BuildingRepository } from "@/database/mongodb/repositories/building.repository";
import { ApartmentStatusEnum } from "@/v1/enum/apartmentStatus.enum";

export class ResidentService {
	private residentRepository: ResidentRepository;
	private apartmentRepository: ApartmentRepository;
	private buildingRepository: BuildingRepository;
	private roleRepository: RoleRepository;
	private s3Provider: S3Provider;

	constructor(mongoClient: MongoClient) {
		this.residentRepository = new ResidentRepository(mongoClient);
		this.apartmentRepository = new ApartmentRepository(mongoClient);
		this.buildingRepository = new BuildingRepository(mongoClient);
		this.roleRepository = new RoleRepository(mongoClient);
		this.s3Provider = new S3Provider();
	}

	public async createResident(residentCreateDto: ResidentCreateDto): Promise<
		HttpResponse<{
			name: string;
			email: string;
			phone: string;
			presignedUrl: string;
		}>
	> {
		const existingResident = await this.residentRepository.findByEmail(
			residentCreateDto.email,
		);

		if (existingResident) {
			throw httpException(
				"Email já cadastrado no sistema.",
				httpStatus.CONFLICT,
			);
		}

		const passwordHash = await hashPassword(residentCreateDto.password);
		const residentCode = await generateCode();

		// Buscar role "resident"
		const residentRole = await this.roleRepository.findByName("resident");
		if (!residentRole) {
			throw httpException(
				"Role 'resident' não encontrado no sistema.",
				httpStatus.NOT_FOUND,
			);
		}

		const residentEntity: CreateResidentEntity = {
			name: residentCreateDto.name,
			buildingId: residentCreateDto.buildingId,
			apartmentId: residentCreateDto.apartmentId,
			roleId: residentRole._id,
			email: residentCreateDto.email,
			passwordHash,
			phone: residentCreateDto.phone,
			status: ResidentStatusEnum.A_CONFIRMACAO_EMAIL,
			photoUrl: null,
			residentCode,
		};

		const createdResident =
			await this.residentRepository.create(residentEntity);

		const residentEmail = new ResidentEmail();
		residentEmail.sendConfirmationEmailAsync(
			createdResident.email,
			createdResident.name,
			residentCode,
		);

		const { presignedUrl, publicUrl } = await this.generatePresignedUrl(
			createdResident._id,
			"jpg",
		);

		await this.residentRepository.update(createdResident._id, {
			photoUrl: publicUrl,
		});

		return {
			success: true,
			message:
				"Morador cadastrado com sucesso! Verifique seu email para confirmar o cadastro.",
			data: {
				name: createdResident.name,
				email: createdResident.email,
				phone: createdResident.phone,
				presignedUrl,
			},
		};
	}

	public async getResident(residentId: string): Promise<
		HttpResponse<{
			email: string;
			phone: string;
		}>
	> {
		const resident = await this.residentRepository.findById(residentId);

		if (!resident) {
			throw httpException("Morador não encontrado", httpStatus.NOT_FOUND);
		}

		return {
			success: true,
			message: "Morador encontrado com sucesso",
			data: {
				email: resident.email,
				phone: resident.phone,
			},
		};
	}

	public async getCurrentResident(residentId: string): Promise<
		HttpResponse<{
			id: string;
			email: string;
			name: string;
			phone?: string;
			photoUrl?: string | null;
			apartmentNumber?: string;
			buildingName?: string;
			buildingId?: string;
			apartmentId?: string;
			apartment?: {
				number?: string;
				block?: string;
				floor?: number;
			};
			apartmentBlock?: string;
			apartmentFloor?: number;
		}>
	> {
		const resident = await this.residentRepository.findById(residentId);

		if (!resident) {
			throw httpException("Morador não encontrado", httpStatus.NOT_FOUND);
		}

		const apartment = resident.apartmentId
			? await this.apartmentRepository.findById(resident.apartmentId)
			: null;

		const building = await this.buildingRepository.findById(
			resident.buildingId,
		);

		return {
			success: true,
			message: "Perfil do morador encontrado",
			data: {
				id: resident._id,
				email: resident.email,
				name: resident.name,
				phone: resident.phone,
				photoUrl: resident.photoUrl || null,
				apartmentNumber: apartment?.number,
				apartmentBlock: apartment?.block,
				apartmentFloor: apartment?.floor,
				buildingName: building?.name,
				buildingId: resident.buildingId,
				apartmentId: resident.apartmentId,
				apartment: apartment
					? {
							number: apartment.number,
							block: apartment.block,
							floor: apartment.floor,
						}
					: undefined,
			},
		};
	}

	public async getResidentByEmail(
		email: string,
	): Promise<ResidentEntity | null> {
		return await this.residentRepository.findByEmail(email);
	}

	public async updateResident(
		residentId: string,
		residentUpdateDto: ResidentUpdateDto,
	): Promise<
		HttpResponse<{
			id: string;
			email: string;
			name: string;
			phone?: string;
			photoUrl?: string | null;
			status?: string;
			createdAt?: string;
			updatedAt?: string;
		}>
	> {
		const resident = await this.residentRepository.findById(residentId);

		if (!resident) {
			throw httpException("Morador não encontrado", httpStatus.NOT_FOUND);
		}

		// Preparar dados de atualização
		const updateData: any = {};

		if (residentUpdateDto.name !== undefined) {
			updateData.name = residentUpdateDto.name;
		}

		if (residentUpdateDto.email !== undefined) {
			updateData.email = residentUpdateDto.email;
		}

		if (residentUpdateDto.phone !== undefined) {
			updateData.phone = residentUpdateDto.phone;
		}

		if (residentUpdateDto.photoUrl !== undefined) {
			updateData.photoUrl = residentUpdateDto.photoUrl;
		}

		if (residentUpdateDto.buildingId !== undefined) {
			updateData.buildingId = residentUpdateDto.buildingId;
		}

		if (residentUpdateDto.apartmentId !== undefined) {
			updateData.apartmentId = residentUpdateDto.apartmentId;
		}

		if (residentUpdateDto.password !== undefined) {
			updateData.passwordHash = await hashPassword(residentUpdateDto.password);
		}

		console.log("Atualizando resident com dados:", updateData);

		const updatedResident = await this.residentRepository.update(
			residentId,
			updateData,
		);

		if (!updatedResident) {
			throw httpException(
				"Erro ao atualizar morador",
				httpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		console.log("Resident atualizado:", updatedResident);

		return {
			success: true,
			message: "Morador atualizado com sucesso",
			data: {
				id: updatedResident._id,
				email: updatedResident.email,
				name: updatedResident.name,
				phone: updatedResident.phone,
				photoUrl: updatedResident.photoUrl || null,
				status: updatedResident.status,
				createdAt: updatedResident.createdAt?.toISOString(),
				updatedAt: updatedResident.updatedAt?.toISOString(),
			},
		};
	}

	public async deleteResident(residentId: string): Promise<HttpResponse<null>> {
		const resident = await this.residentRepository.findById(residentId);

		if (!resident) {
			throw httpException("Morador não encontrado", httpStatus.NOT_FOUND);
		}

		const deleted = await this.residentRepository.delete(residentId);

		if (!deleted) {
			throw httpException(
				"Erro ao deletar morador",
				httpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		return {
			success: true,
			message: "Morador deletado com sucesso",
			data: null,
		};
	}

	public async generatePresignedUrlForPhoto(
		residentId: string,
		fileExtension: string,
	): Promise<
		HttpResponse<{
			presignedUrl: string;
			photoUrl: string;
			s3Key: string;
			instructions: string;
			expiresIn: string;
		}>
	> {
		const result = await this.generatePresignedUrl(residentId, fileExtension);

		return {
			success: true,
			message: "URL pré-assinada gerada com sucesso",
			data: {
				presignedUrl: result.presignedUrl,
				photoUrl: result.publicUrl,
				s3Key: result.s3Key,
				instructions:
					"Use a presignedUrl para fazer upload da foto via PUT request. O photoUrl é a URL pública final da foto.",
				expiresIn: result.expiresIn,
			},
		};
	}

	private async generatePresignedUrl(
		residentId: string,
		fileExtension: string,
	): Promise<{
		presignedUrl: string;
		s3Key: string;
		expiresIn: string;
		publicUrl: string;
	}> {
		const resident = await this.residentRepository.findById(residentId);

		if (!resident) {
			throw httpException("Morador não encontrado", httpStatus.NOT_FOUND);
		}

		const fileName = `${resident._id}-photo.${fileExtension}`;
		const s3Key = `${env.providers.aws.s3.folders.resident}/${residentId}/${fileName}`;

		const contentTypeMap: Record<string, string> = {
			jpg: "image/jpeg",
			jpeg: "image/jpeg",
			png: "image/png",
		};

		const contentType =
			contentTypeMap[fileExtension.toLowerCase()] || "application/octet-stream";

		const presignedUrl = await this.s3Provider.getPresignedUrlForPut(
			s3Key,
			contentType,
			60,
		);
		const publicUrl = this.s3Provider.getPublicUrl(s3Key);

		return {
			presignedUrl,
			publicUrl,
			s3Key,
			expiresIn: `${env.providers.aws.s3.presignedUrlExpiration} segundos`,
		};
	}

	public async confirmResidentCode(
		residentConfirmDto: ResidentConfirmDto,
	): Promise<HttpResponse<null>> {
		const resident = await this.getResidentByEmail(residentConfirmDto.email);

		if (!resident) {
			throw httpException("Morador não encontrado", httpStatus.NOT_FOUND);
		}

		if (
			resident.status === ResidentStatusEnum.A_VALIDACAO ||
			resident.status === ResidentStatusEnum.ATIVO
		) {
			throw httpException(
				"Cadastro já foi confirmado anteriormente",
				httpStatus.BAD_REQUEST,
			);
		}

		if (resident.status !== ResidentStatusEnum.A_CONFIRMACAO_EMAIL) {
			throw httpException(
				"Email já foi confirmado ou status inválido",
				httpStatus.BAD_REQUEST,
			);
		}

		if (resident.residentCode !== residentConfirmDto.code) {
			throw httpException(
				"Código de confirmação inválido",
				httpStatus.BAD_REQUEST,
			);
		}

		await this.residentRepository.updateByEmail(residentConfirmDto.email, {
			status: ResidentStatusEnum.A_VALIDACAO,
		});

		const apartment = await this.apartmentRepository.findById(
			resident.apartmentId,
		);

		if (apartment) {
			if (apartment.status === ApartmentStatusEnum.DESOCUPADO) {
				await this.apartmentRepository.update(resident.apartmentId, {
					status: ApartmentStatusEnum.OCUPADO,
				});
			}
		}

		return {
			success: true,
			message:
				"Cadastro confirmado com sucesso! Aguarde a aprovação do administrador.",
			data: null,
		};
	}

	public async forgetPassword(
		forgetPasswordDto: ResidentForgetPasswordDto,
	): Promise<HttpResponse<null>> {
		const resident = await this.residentRepository.findByEmail(
			forgetPasswordDto.email,
		);

		if (!resident) {
			throw httpException("Email não encontrado", httpStatus.NOT_FOUND);
		}

		const resetCode = generateResetCode();
		const resetTokenExpiry = getDate();
		resetTokenExpiry.setMinutes(resetTokenExpiry.getMinutes() + 15);

		await this.residentRepository.update(resident._id, {
			resetPasswordToken: resetCode,
			resetPasswordTokenExpiry: resetTokenExpiry,
		});

		sendPasswordResetEmail(
			resident.email,
			resident.name,
			resetCode,
			`https://coliseucondo.com.br/reset-password?email=${resident.email}`,
		);

		return {
			success: true,
			message:
				"Código de recuperação enviado para seu email. Verifique sua caixa de entrada.",
			data: null,
		};
	}

	public async getResidentStatusByEmail(email: string): Promise<
		HttpResponse<{
			name: string;
			email: string;
			apartmentNumber?: string;
			apartmentBlock?: string;
			status: string;
			rejectType?: string;
			rejectNote?: string;
			buildingId?: string;
			apartmentId?: string;
		}>
	> {
		const resident = await this.getResidentByEmail(email);

		if (!resident) {
			throw httpException("Morador não encontrado", httpStatus.NOT_FOUND);
		}

		// Buscar dados do apartamento
		const apartment = await this.apartmentRepository.findById(
			resident.apartmentId,
		);

		return {
			success: true,
			message: "Dados do morador encontrados",
			data: {
				name: resident.name,
				email: resident.email,
				apartmentNumber: apartment?.number,
				apartmentBlock: apartment?.block,
				status: resident.status,
				rejectType: resident.rejectType,
				rejectNote: resident.rejectNote,
				buildingId: resident.buildingId,
				apartmentId: resident.apartmentId,
			},
		};
	}

	public async resendConfirmationEmail(
		email: string,
	): Promise<HttpResponse<null>> {
		const resident = await this.getResidentByEmail(email);

		if (!resident) {
			throw httpException("Morador não encontrado", httpStatus.NOT_FOUND);
		}

		if (resident.status !== ResidentStatusEnum.A_CONFIRMACAO_EMAIL) {
			throw httpException(
				"Email de confirmação só pode ser reenviado para cadastros aguardando confirmação de email",
				httpStatus.BAD_REQUEST,
			);
		}

		// Reenviar email de confirmação
		const residentEmail = new ResidentEmail();
		residentEmail.sendConfirmationEmailAsync(
			resident.email,
			resident.name,
			resident.residentCode,
		);

		return {
			success: true,
			message: "Email de confirmação reenviado com sucesso",
			data: null,
		};
	}

	public async updateRejectedResident(
		email: string,
		residentUpdateDto: ResidentUpdateDto,
	): Promise<
		HttpResponse<{
			email: string;
			phone: string;
			status: string;
			presignedUrl?: string;
		}>
	> {
		const resident = await this.getResidentByEmail(email);

		if (!resident) {
			throw httpException("Morador não encontrado", httpStatus.NOT_FOUND);
		}

		if (resident.status !== ResidentStatusEnum.REJEITADO) {
			throw httpException(
				"Esta operação só é permitida para cadastros rejeitados",
				httpStatus.BAD_REQUEST,
			);
		}

		// Verificar se email foi alterado e se já existe
		if (residentUpdateDto.email && residentUpdateDto.email !== resident.email) {
			const existingResident = await this.residentRepository.findByEmail(
				residentUpdateDto.email,
			);
			if (existingResident && existingResident._id !== resident._id) {
				throw httpException(
					"Email já cadastrado no sistema",
					httpStatus.CONFLICT,
				);
			}
		}

		// Preparar dados de atualização
		const updateData: any = {
			status: ResidentStatusEnum.A_VALIDACAO,
		};

		if (residentUpdateDto.name) {
			updateData.name = residentUpdateDto.name;
		}

		if (residentUpdateDto.email) {
			updateData.email = residentUpdateDto.email;
		}

		if (residentUpdateDto.phone) {
			updateData.phone = residentUpdateDto.phone;
		}

		if (residentUpdateDto.buildingId) {
			updateData.buildingId = residentUpdateDto.buildingId;
		}

		if (residentUpdateDto.apartmentId) {
			updateData.apartmentId = residentUpdateDto.apartmentId;
		}

		// Se senha foi fornecida, fazer hash
		if (residentUpdateDto.password) {
			updateData.passwordHash = await hashPassword(residentUpdateDto.password);
		}

		// Gerar presignedUrl para foto (sempre, mesmo que não seja usada)
		const { presignedUrl, publicUrl } = await this.generatePresignedUrl(
			resident._id,
			"jpg",
		);

		// Atualizar photoUrl
		updateData.photoUrl = publicUrl;

		// Atualizar dados
		const updatedResident = await this.residentRepository.update(
			resident._id,
			updateData,
		);

		// Remover campos de rejeição usando $unset
		if (updatedResident) {
			await this.residentRepository.removeRejectionFields(resident._id);
		}

		if (!updatedResident) {
			throw httpException(
				"Erro ao atualizar morador",
				httpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		return {
			success: true,
			message:
				"Dados atualizados com sucesso. Seu cadastro será revisado novamente.",
			data: {
				email: updatedResident.email,
				phone: updatedResident.phone,
				status: updatedResident.status,
				presignedUrl,
			},
		};
	}

	public async resetPassword(
		resetPasswordDto: ResidentResetPasswordDto,
	): Promise<HttpResponse<null>> {
		const resident = await this.residentRepository.findByEmail(
			resetPasswordDto.email,
		);

		if (!resident) {
			throw httpException("Email não encontrado", httpStatus.NOT_FOUND);
		}

		if (!resident.resetPasswordToken || !resident.resetPasswordTokenExpiry) {
			throw httpException(
				"Nenhuma solicitação de recuperação de senha encontrada",
				httpStatus.BAD_REQUEST,
			);
		}

		if (resident.resetPasswordToken !== resetPasswordDto.code) {
			throw httpException(
				"Código de recuperação inválido",
				httpStatus.BAD_REQUEST,
			);
		}

		const now = getDate();
		if (now > resident.resetPasswordTokenExpiry) {
			throw httpException(
				"Código de recuperação expirado. Solicite um novo código.",
				httpStatus.BAD_REQUEST,
			);
		}

		const newPasswordHash = await hashPassword(resetPasswordDto.newPassword);

		await this.residentRepository.update(resident._id, {
			status: ResidentStatusEnum.ATIVO,
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

	public async changePassword(
		residentId: string,
		changePasswordDto: ResidentChangePasswordDto,
	): Promise<HttpResponse<null>> {
		const resident = await this.residentRepository.findById(residentId);

		if (!resident) {
			throw httpException("Morador não encontrado", httpStatus.NOT_FOUND);
		}

		// Verificar se a senha atual está correta
		const isCurrentPasswordValid = await this.comparePassword(
			changePasswordDto.currentPassword,
			resident.passwordHash,
		);

		if (!isCurrentPasswordValid) {
			throw httpException("Senha atual incorreta", httpStatus.UNAUTHORIZED);
		}

		// Hash da nova senha
		const newPasswordHash = await hashPassword(changePasswordDto.newPassword);

		// Atualizar senha
		await this.residentRepository.update(resident._id, {
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
