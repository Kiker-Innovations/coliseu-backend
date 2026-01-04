import type { MongoClient } from "mongodb";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";
import { InfractionRepository } from "../../../database/mongodb/repositories/infraction.repository";
import type { CreateInfractionEntity } from "../../../database/mongodb/entity/infraction.entity";
import type {
	InfractionCreateFineDto,
	InfractionCreateNotificationDto,
	InfractionAppealDto,
} from "./dto";
import { FineStatusEnum } from "../../enum/fineStatus.enum";
import { InfractionStatusEnum } from "../../enum/infractionStatus.enum";
import { InfractionTypeEnum } from "../../enum/infractionType.enum";
import { FineRepository } from "../../../database/mongodb/repositories/fine.repository";
import { ApartmentRepository } from "../../../database/mongodb/repositories/apartment.repository";
import { InfractionAppealRepository } from "../../../database/mongodb/repositories/infractionAppeal.repository";
import { S3Provider } from "../../../providers/aws/s3.provider";
import { env } from "../../../config/env";
import { InfractionAppealTypeEnum } from "../../enum/infractionAppealType";
import { randomUUID } from "node:crypto";
import { getDate } from "../../utils/utils";

export class InfractionService {
	private infractionRepository: InfractionRepository;
	private fineRepository: FineRepository;
	private apartmentRepository: ApartmentRepository;
	private infractionAppealRepository: InfractionAppealRepository;
	private s3Provider: S3Provider;

	constructor(mongoClient: MongoClient) {
		this.infractionRepository = new InfractionRepository(mongoClient);
		this.fineRepository = new FineRepository(mongoClient);
		this.apartmentRepository = new ApartmentRepository(mongoClient);
		this.infractionAppealRepository = new InfractionAppealRepository(mongoClient);
		this.s3Provider = new S3Provider();
	}

	public async createFineInfraction(
		infractionCreateFineDto: InfractionCreateFineDto
	): Promise<
		HttpResponse<{
			_id: string;
			apartmentId: string;
			fineId: string;
			type: string;
			value: number;
			occurrenceDate: Date;
			status: string;
			createdAt: Date;
		}>
	> {
		// Verificar se o fine existe
		const fine = await this.fineRepository.findById(
			infractionCreateFineDto.fineId
		);
		if (!fine) {
			throw httpException("Multa não encontrada", httpStatus.NOT_FOUND);
		}

		// Verificar se o apartamento existe
		const apartment = await this.apartmentRepository.findById(
			infractionCreateFineDto.apartmentId
		);
		if (!apartment) {
			throw httpException("Apartamento não encontrado", httpStatus.NOT_FOUND);
		}

		const infractionEntity: CreateInfractionEntity = {
			apartmentId: infractionCreateFineDto.apartmentId,
			fineId: infractionCreateFineDto.fineId,
			type: InfractionTypeEnum.MULTA,
			description: "",
			value: infractionCreateFineDto.value,
			occurrenceDate: infractionCreateFineDto.occurrenceDate,
			status: FineStatusEnum.PENDENTE,
		};

		const createdInfraction = await this.infractionRepository.create(
			infractionEntity
		);

		return {
			success: true,
			message: "Multa aplicada com sucesso!",
			data: {
				_id: createdInfraction._id,
				apartmentId: createdInfraction.apartmentId,
				fineId: createdInfraction.fineId,
				type: createdInfraction.type,
				value: createdInfraction.value,
				occurrenceDate: createdInfraction.occurrenceDate,
				status: createdInfraction.status,
				createdAt: createdInfraction.createdAt,
			},
		};
	}

	public async createNotificationInfraction(
		infractionCreateNotificationDto: InfractionCreateNotificationDto
	): Promise<
		HttpResponse<{
			_id: string;
			apartmentId: string;
			fineId: string;
			type: string;
			description: string;
			occurrenceDate: Date;
			status: string;
			createdAt: Date;
		}>
	> {
		// Verificar se o fine existe
		const fine = await this.fineRepository.findById(
			infractionCreateNotificationDto.fineId
		);
		if (!fine) {
			throw httpException("Multa/Notificação não encontrada", httpStatus.NOT_FOUND);
		}

		// Verificar se o apartamento existe
		const apartment = await this.apartmentRepository.findById(
			infractionCreateNotificationDto.apartmentId
		);
		if (!apartment) {
			throw httpException("Apartamento não encontrado", httpStatus.NOT_FOUND);
		}

		const infractionEntity: CreateInfractionEntity = {
			apartmentId: infractionCreateNotificationDto.apartmentId,
			fineId: infractionCreateNotificationDto.fineId,
			type: InfractionTypeEnum.NOTIFICACAO,
			description: infractionCreateNotificationDto.description,
			value: 0,
			occurrenceDate: new Date(infractionCreateNotificationDto.occurrenceDate),
			status: InfractionStatusEnum.ATIVO,
		};

		const createdInfraction = await this.infractionRepository.create(
			infractionEntity
		);

		return {
			success: true,
			message: "Notificação aplicada com sucesso!",
			data: {
				_id: createdInfraction._id,
				apartmentId: createdInfraction.apartmentId,
				fineId: createdInfraction.fineId,
				type: createdInfraction.type,
				description: createdInfraction.description,
				occurrenceDate: createdInfraction.occurrenceDate,
				status: createdInfraction.status,
				createdAt: createdInfraction.createdAt,
			},
		};
	}

	public async getInfractions(
		buildingId: string,
		apartmentId?: string,
		status?: string
	): Promise<
		HttpResponse<
			Array<{
				_id: string;
				buildingId: string;
				number: string;
				block: string;
				floor: number;
				status: string;
				createdAt: Date;
				updatedAt: Date;
				residents: Array<{
					_id: string;
					name: string;
					email: string;
					phone?: string;
				}>;
				infractions: Array<{
					_id: string;
					apartmentId: string;
					fineId: string;
					type: string;
					description: string;
					value: number;
					occurrenceDate: Date;
					status: string;
					createdAt: Date;
					updatedAt: Date;
					contextedAt?: Date;
					confirmedAt?: Date;
					paidAt?: Date;
					canceledAt?: Date;
					canceledNote?: string;
				}>;
			}>
		>
	> {
		const apartments = await this.apartmentRepository.findManyWithInfractionsAndResidents(
			buildingId,
			{ apartmentId, status }
		);

		return {
			success: true,
			message: "Infrações encontradas com sucesso",
			data: apartments.map((apartment) => ({
				_id: apartment._id,
				buildingId: apartment.buildingId,
				number: apartment.number,
				block: apartment.block,
				floor: apartment.floor,
				status: apartment.status,
				createdAt: apartment.createdAt,
				updatedAt: apartment.updatedAt,
				residents: apartment.residents,
				infractions: apartment.infractions,
			})),
		};
	}

	public async getMyFines(
		apartmentId: string,
		status?: string
	): Promise<
		HttpResponse<
			Array<{
				_id: string;
				apartmentId: string;
				fineId: string;
				type: string;
				description: string;
				value: number;
				occurrenceDate: Date;
				status: string;
				createdAt: Date;
				updatedAt: Date;
				confirmedAt?: Date;
				paidAt?: Date;
				canceledAt?: Date;
				canceledNote?: string;
				fineName?: string;
				fineDescription?: string;
			}>
		>
	> {
		const filter: any = {
			apartmentId,
			type: InfractionTypeEnum.MULTA,
		};

		if (status) {
			filter.status = status;
		}

		const fines = await this.infractionRepository.findManySortedByDateWithFine(
			filter,
			-1
		);

		return {
			success: true,
			message: "Multas encontradas com sucesso",
			data: fines.map((fine) => ({
				_id: fine._id,
				apartmentId: fine.apartmentId,
				fineId: fine.fineId,
				type: fine.type,
				description: fine.description,
				value: fine.value,
				occurrenceDate: fine.occurrenceDate,
				status: fine.status,
				createdAt: fine.createdAt,
				updatedAt: fine.updatedAt,
				contextedAt: fine.contextedAt,
				confirmedAt: fine.confirmedAt,
				paidAt: fine.paidAt,
				canceledAt: fine.canceledAt,
				canceledNote: fine.canceledNote,
				fineName: fine.fineName,
				fineDescription: fine.fineDescription,
			})),
		};
	}

	public async contestInfraction(
		infractionAppealDto: InfractionAppealDto,
		residentId: string,
		apartmentId: string
	): Promise<
		HttpResponse<{
			_id: string;
			infractionId: string;
			presignedUrl: string;
			createdAt: Date;
		}>
	> {
		// Verificar se a infraction existe
		const infraction = await this.infractionRepository.findById(
			infractionAppealDto.infractionId
		);
		if (!infraction) {
			throw httpException("Infração não encontrada", httpStatus.NOT_FOUND);
		}

		// Verificar se a infraction pertence ao apartamento do resident
		if (infraction.apartmentId !== apartmentId) {
			throw httpException(
				"Você não tem permissão para contestar esta infração",
				httpStatus.FORBIDDEN
			);
		}

		// Verificar se a infraction já foi contestada
		const existingAppeal = await this.infractionAppealRepository.findOne({
			fineId: infraction._id,
			residentId,
		});
		if (existingAppeal) {
			throw httpException(
				"Esta infração já foi contestada",
				httpStatus.BAD_REQUEST
			);
		}

		// Gerar presigned URL para upload
		const appealId = randomUUID();
		const fileExtension = infractionAppealDto.fileName
			.split(".")
			.pop()
			?.toLowerCase();

		const s3Key = `${env.providers.aws.s3.folders.infractions}/${apartmentId}/${appealId}.${fileExtension || "pdf"}`;

		const presignedUrl = await this.s3Provider.getPresignedUrlForPut(
			s3Key,
			infractionAppealDto.mimeType,
			300 // 5 minutos
		);

		const publicUrl = this.s3Provider.getPublicUrl(s3Key);

		// Criar o appeal no banco
		const appealEntity = await this.infractionAppealRepository.create({
			fineId: infraction._id,
			residentId,
			type: InfractionAppealTypeEnum.CONTEXT,
			text: infractionAppealDto.text,
			fileName: infractionAppealDto.fileName,
			fileSize: infractionAppealDto.fileSize,
			url: publicUrl,
		});

		// Atualizar a infraction com status EM_REVISAO e contextedAt
		await this.infractionRepository.update(infraction._id, {
			status: FineStatusEnum.EM_REVISAO,
			contextedAt: getDate(),
		});

		return {
			success: true,
			message: "Contestação criada com sucesso! Faça upload do arquivo usando a URL assinada.",
			data: {
				_id: appealEntity._id,
				infractionId: infraction._id,
				presignedUrl,
				createdAt: appealEntity.createdAt,
			},
		};
	}

	public async getInfractionAppeal(
		infractionId: string,
		residentId: string,
		apartmentId: string
	): Promise<
		HttpResponse<{
			_id: string;
			infractionId: string;
			text: string;
			fileName: string;
			fileSize: number;
			url: string;
			createdAt: Date;
		}>
	> {
		// Verificar se a infraction existe
		const infraction = await this.infractionRepository.findById(infractionId);
		if (!infraction) {
			throw httpException("Infração não encontrada", httpStatus.NOT_FOUND);
		}

		// Verificar se a infraction pertence ao apartamento do resident
		if (infraction.apartmentId !== apartmentId) {
			throw httpException(
				"Você não tem permissão para visualizar esta contestação",
				httpStatus.FORBIDDEN
			);
		}

		// Buscar a contestação
		const appeal = await this.infractionAppealRepository.findOne({
			fineId: infractionId,
			residentId,
		});

		if (!appeal) {
			throw httpException(
				"Contestação não encontrada",
				httpStatus.NOT_FOUND
			);
		}

		return {
			success: true,
			message: "Contestação encontrada com sucesso",
			data: {
				_id: appeal._id,
				infractionId: appeal.fineId,
				text: appeal.text,
				fileName: appeal.fileName,
				fileSize: appeal.fileSize,
				url: appeal.url,
				createdAt: appeal.createdAt,
			},
		};
	}

	public async getInfractionAppealForAdmin(
		infractionId: string
	): Promise<
		HttpResponse<{
			_id: string;
			infractionId: string;
			text: string;
			fileName: string;
			fileSize: number;
			url: string;
			createdAt: Date;
			residentId: string;
		}>
	> {
		// Verificar se a infraction existe
		const infraction = await this.infractionRepository.findById(infractionId);
		if (!infraction) {
			throw httpException("Infração não encontrada", httpStatus.NOT_FOUND);
		}

		// Buscar a contestação (admin pode ver qualquer contestação)
		const appeal = await this.infractionAppealRepository.findOne({
			fineId: infractionId,
		});

		if (!appeal) {
			throw httpException(
				"Contestação não encontrada",
				httpStatus.NOT_FOUND
			);
		}

		return {
			success: true,
			message: "Contestação encontrada com sucesso",
			data: {
				_id: appeal._id,
				infractionId: appeal.fineId,
				text: appeal.text,
				fileName: appeal.fileName,
				fileSize: appeal.fileSize,
				url: appeal.url,
				createdAt: appeal.createdAt,
				residentId: appeal.residentId,
			},
		};
	}

	public async approveAppeal(
		infractionId: string
	): Promise<HttpResponse<{ _id: string; status: string; canceledAt: Date }>> {
		const infraction = await this.infractionRepository.findById(infractionId);
		if (!infraction) {
			throw httpException("Infração não encontrada", httpStatus.NOT_FOUND);
		}

		if (infraction.status !== FineStatusEnum.EM_REVISAO) {
			throw httpException(
				"A infração não está em revisão",
				httpStatus.BAD_REQUEST
			);
		}

		const updatedInfraction = await this.infractionRepository.update(
			infractionId,
			{
				status: FineStatusEnum.CANCELADA,
				canceledAt: getDate(),
			}
		);

		if (!updatedInfraction) {
			throw httpException(
				"Erro ao atualizar infração",
				httpStatus.INTERNAL_SERVER_ERROR
			);
		}

		return {
			success: true,
			message: "Contestação aprovada com sucesso. A multa foi cancelada.",
			data: {
				_id: updatedInfraction._id,
				status: updatedInfraction.status,
				canceledAt: updatedInfraction.canceledAt!,
			},
		};
	}

	public async rejectAppeal(
		infractionId: string
	): Promise<HttpResponse<{ _id: string; status: string; confirmedAt: Date }>> {
		const infraction = await this.infractionRepository.findById(infractionId);
		if (!infraction) {
			throw httpException("Infração não encontrada", httpStatus.NOT_FOUND);
		}

		if (infraction.status !== FineStatusEnum.EM_REVISAO) {
			throw httpException(
				"A infração não está em revisão",
				httpStatus.BAD_REQUEST
			);
		}

		const updatedInfraction = await this.infractionRepository.update(
			infractionId,
			{
				status: FineStatusEnum.PENDENTE,
				confirmedAt: getDate(),
			}
		);

		if (!updatedInfraction) {
			throw httpException(
				"Erro ao atualizar infração",
				httpStatus.INTERNAL_SERVER_ERROR
			);
		}

		return {
			success: true,
			message: "Contestação reprovada. A multa voltou para pendente.",
			data: {
				_id: updatedInfraction._id,
				status: updatedInfraction.status,
				confirmedAt: updatedInfraction.confirmedAt!,
			},
		};
	}
}
