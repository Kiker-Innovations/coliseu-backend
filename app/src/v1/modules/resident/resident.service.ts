import { randomBytes, randomUUID } from "node:crypto";
import type { MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
	CreateResidentEntity,
	ResidentEntity,
} from "../../../database/mongodb/entity/resident.entity";
import { ResidentRepository } from "../../../database/mongodb/repositories/resident.repository";
import { S3Provider } from "../../../providers/aws/s3.provider";
import { SESProvider } from "../../../providers/aws/ses.provider";
import { ResidentStatusEnum } from "../../enum/residentStatus.enum";
import type {
	ResidentConfirmDto,
	ResidentCreateDto,
	ResidentUpdateDto,
} from "./dto";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";

export class ResidentService {
	private residentRepository: ResidentRepository;
	private s3Provider: S3Provider;
	private sesProvider: SESProvider;

	constructor(mongoClient: MongoClient) {
		this.residentRepository = new ResidentRepository(mongoClient);
		this.s3Provider = new S3Provider();
		this.sesProvider = new SESProvider();
	}

	public async createResident(residentCreateDto: ResidentCreateDto): Promise<
		HttpResponse<{
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

		const passwordHash = await this.hashPassword(residentCreateDto.password);
		const residentCode = this.generateResidentCode();

		const residentEntity: CreateResidentEntity = {
			apartmentNumber: residentCreateDto.apartmentNumber,
			email: residentCreateDto.email,
			passwordHash,
			phone: residentCreateDto.phone,
			status: ResidentStatusEnum.INATIVO,
			photoUrl: null,
			residentCode,
		};

		const createdResident =
			await this.residentRepository.create(residentEntity);

		// this.sendConfirmationEmailAsync(residentCreateDto.email, residentCode);

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

	public async generatePresignedUrl(
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

		const fileName = `${resident._id}-register-image.${fileExtension}`;
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

		// Atualiza status para VALIDADO
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

	public async sendConfirmationEmail(
		email: string,
		residentCode: string,
	): Promise<string> {
		return await this.sesProvider.sendConfirmationEmail(email, residentCode);
	}

	private sendConfirmationEmailAsync(
		email: string,
		residentCode: string,
	): void {
		this.sendConfirmationEmail(email, residentCode)
			.then(() => {
				console.log(`Email de confirmação enviado para ${email}`);
			})
			.catch((error) => {
				console.error(
					`Erro ao enviar email de confirmação para ${email}:`,
					error,
				);
			});
	}

	private async hashPassword(password: string): Promise<string> {
		const bcrypt = await import("bcrypt");
		const saltRounds = 10;
		return await bcrypt.hash(password, saltRounds);
	}

	private generateResidentCode(): string {
		const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
		const bytes = randomBytes(6);
		let code = "";
		for (const byte of bytes) {
			code += chars[byte % chars.length];
		}
		return code;
	}
}
