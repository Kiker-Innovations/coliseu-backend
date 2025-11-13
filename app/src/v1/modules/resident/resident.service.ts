import { randomUUID } from "node:crypto";
import type { MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
	CreateResidentEntity,
	ResidentEntity,
} from "../../../database/mongodb/entity/resident.entity";
import { ResidentRepository } from "../../../database/mongodb/repositories/resident.repository";
import { S3Provider } from "../../../providers/aws/s3.provider";
import { ResidentStatusEnum } from "../../enum/residentStatus.enum";
import type {
	ResidentConfirmDto,
	ResidentCreateDto,
	ResidentUpdateDto,
	ResidentForgetPasswordDto,
	ResidentResetPasswordDto,
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

export class ResidentService {
	private residentRepository: ResidentRepository;
	private s3Provider: S3Provider;

	constructor(mongoClient: MongoClient) {
		this.residentRepository = new ResidentRepository(mongoClient);
		this.s3Provider = new S3Provider();
	}

	public async createResident(residentCreateDto: ResidentCreateDto): Promise<
		HttpResponse<{
			name: string;
			email: string;
			apartmentNumber: string;
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

		const residentEntity: CreateResidentEntity = {
			name: residentCreateDto.name,
			buildingId: residentCreateDto.buildingId,
			apartmentNumber: residentCreateDto.apartmentNumber,
			blockName: residentCreateDto.blockName,
			email: residentCreateDto.email,
			passwordHash,
			phone: residentCreateDto.phone,
			status: ResidentStatusEnum.INATIVO,
			photoUrl: null,
			residentCode,
		};

		const createdResident =
			await this.residentRepository.create(residentEntity);

		const residentEmail = new ResidentEmail();
		residentEmail.sendConfirmationEmailAsync(
				createdResident.email,
				createdResident.name,
				createdResident.apartmentNumber,
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
				apartmentNumber: createdResident.apartmentNumber,
				phone: createdResident.phone,
				presignedUrl,
			},
		};
	}

	public async getResident(residentId: string): Promise<
		HttpResponse<{
			email: string;
			apartmentNumber: string;
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
				apartmentNumber: resident.apartmentNumber,
				phone: resident.phone,
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
			email: string;
			apartmentNumber: string;
			phone: string;
		}>
	> {
		const resident = await this.residentRepository.findById(residentId);

		if (!resident) {
			throw httpException("Morador não encontrado", httpStatus.NOT_FOUND);
		}

		const updatedResident = await this.residentRepository.update(
			residentId,
			residentUpdateDto,
		);

		if (!updatedResident) {
			throw httpException(
				"Erro ao atualizar morador",
				httpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		return {
			success: true,
			message: "Morador atualizado com sucesso",
			data: {
				email: updatedResident.email,
				apartmentNumber: updatedResident.apartmentNumber,
				phone: updatedResident.phone,
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
			resident.status === ResidentStatusEnum.VALIDADO ||
			resident.status === ResidentStatusEnum.ATIVO
		) {
			throw httpException(
				"Cadastro já foi confirmado anteriormente",
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
			status: ResidentStatusEnum.VALIDADO,
		});

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
		resetTokenExpiry.setMinutes(resetTokenExpiry.getMinutes() + 15); // Expira em 15 minutos

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
