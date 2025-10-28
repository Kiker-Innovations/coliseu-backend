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
import type { ResidentCreateDto, ResidentUpdateDto } from "./dto";

export class ResidentService {
	private residentRepository: ResidentRepository;
	private s3Provider: S3Provider;
	private sesProvider: SESProvider;

	constructor(mongoClient: MongoClient) {
		this.residentRepository = new ResidentRepository(mongoClient);
		this.s3Provider = new S3Provider();
		this.sesProvider = new SESProvider();
	}

	public async createResident(
		residentCreateDto: ResidentCreateDto,
	): Promise<ResidentEntity> {
		const existingResident = await this.residentRepository.findByEmail(
			residentCreateDto.email,
		);
		if (existingResident) {
			throw new Error("Email já cadastrado no sistema");
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

		this.sendConfirmationEmailAsync(residentCreateDto.email, residentCode);

		return createdResident;
	}

	public async getResident(residentId: string): Promise<ResidentEntity | null> {
		return await this.residentRepository.findById(residentId);
	}

	public async getResidentByEmail(
		email: string,
	): Promise<ResidentEntity | null> {
		return await this.residentRepository.findByEmail(email);
	}

	public async updateResident(
		residentId: string,
		input: ResidentUpdateDto,
	): Promise<ResidentEntity | null> {
		return await this.residentRepository.update(residentId, input);
	}

	public async deleteResident(residentId: string): Promise<boolean> {
		return await this.residentRepository.delete(residentId);
	}

	public async generatePresignedUrl(
		residentId: string,
		fileExtension: string,
	): Promise<{ presignedUrl: string; photoUrl: string; s3Key: string }> {
		const fileName = `${randomUUID()}.${fileExtension}`;
		const s3Key = `${env.providers.aws.s3.folders.resident}/${residentId}/${fileName}`;

		const contentTypeMap: Record<string, string> = {
			jpg: "image/jpeg",
			jpeg: "image/jpeg",
			png: "image/png",
			gif: "image/gif",
			webp: "image/webp",
		};
		const contentType =
			contentTypeMap[fileExtension.toLowerCase()] || "application/octet-stream";

		const presignedUrl = await this.s3Provider.getPresignedUrlForPut(
			s3Key,
			contentType,
		);
		const photoUrl = this.s3Provider.getPublicUrl(s3Key);

		return {
			presignedUrl,
			photoUrl,
			s3Key,
		};
	}

	public async confirmResidentCode(
		email: string,
		code: string,
	): Promise<{ success: boolean; message: string }> {
		const resident = await this.getResidentByEmail(email);

		if (!resident) {
			return {
				success: false,
				message: "Morador não encontrado",
			};
		}

		if (
			resident.status === ResidentStatusEnum.VALIDADO ||
			resident.status === ResidentStatusEnum.ATIVO
		) {
			return {
				success: false,
				message: "Cadastro já foi confirmado anteriormente",
			};
		}

		if (resident.residentCode !== code) {
			return {
				success: false,
				message: "Código de confirmação inválido",
			};
		}

		// Atualiza status para VALIDADO
		await this.residentRepository.updateByEmail(email, {
			status: ResidentStatusEnum.VALIDADO,
		});

		return {
			success: true,
			message:
				"Cadastro confirmado com sucesso! Aguarde a aprovação do administrador.",
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
