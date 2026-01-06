import type { MongoClient } from "mongodb";
import { env } from "../../../config/env";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";
import { NoticeRepository } from "../../../database/mongodb/repositories/notice.repository";
import { BuildingRepository } from "../../../database/mongodb/repositories/building.repository";
import { ResidentRepository } from "../../../database/mongodb/repositories/resident.repository";
import type { NoticeStatusEnumType } from "../../enum/noticeStatus.enum";
import type { CreateNoticeEntity } from "../../../database/mongodb/entity/notice.entity";
import { S3Provider } from "../../../providers/aws/s3.provider";
import type { NoticeCreateDto } from "./dto";
import { NoticeEmail } from "./notice.emails";
import { ResidentStatusEnum } from "../../enum/residentStatus.enum";

export class NoticeService {
	private noticeRepository: NoticeRepository;
	private buildingRepository: BuildingRepository;
	private residentRepository: ResidentRepository;
	private s3Provider: S3Provider;

	constructor(mongoClient: MongoClient) {
		this.noticeRepository = new NoticeRepository(mongoClient);
		this.buildingRepository = new BuildingRepository(mongoClient);
		this.residentRepository = new ResidentRepository(mongoClient);
		this.s3Provider = new S3Provider();
	}

	public async createNotice(noticeCreateDto: NoticeCreateDto): Promise<
		HttpResponse<{
			_id: string;
			title: string;
			content: string;
			url: string;
			presignedUrl: string;
			status: NoticeStatusEnumType;
			createdAt: Date;
		}>
	> {
		const building = await this.buildingRepository.findById(
			noticeCreateDto.buildingId,
		);

		if (!building) {
			throw httpException("Edifício não encontrado", httpStatus.NOT_FOUND);
		}

		const noticeId = crypto.randomUUID();
		const fileExtension = noticeCreateDto.fileName
			.split(".")
			.pop()
			?.toLowerCase();

		const { presignedUrl, publicUrl } = await this.generatePresignedUrl(
			noticeCreateDto.buildingId,
			noticeId,
			fileExtension || "pdf",
			noticeCreateDto.mimeType,
		);

		const noticeEntity: CreateNoticeEntity = {
			buildingId: noticeCreateDto.buildingId,
			title: noticeCreateDto.title,
			content: noticeCreateDto.content,
			url: publicUrl,
			fileName: noticeCreateDto.fileName,
			fileSize: noticeCreateDto.fileSize,
			mimeType: noticeCreateDto.mimeType,
			status: noticeCreateDto.status,
		};

		const createdNotice = await this.noticeRepository.create(noticeEntity);

		// Enviar notificações por email para todos os residentes ativos
		this.sendNotificationToResidentsAsync(
			noticeCreateDto.buildingId,
			createdNotice.title,
			createdNotice.content,
			createdNotice.url,
			createdNotice.fileName ? true : false,
		);

		return {
			success: true,
			message: "Aviso criado com sucesso! Os moradores serão notificados.",
			data: {
				_id: createdNotice._id,
				title: createdNotice.title,
				content: createdNotice.content,
				url: createdNotice.url,
				presignedUrl,
				status: createdNotice.status,
				createdAt: createdNotice.createdAt,
			},
		};
	}

	private async generatePresignedUrl(
		buildingId: string,
		noticeId: string,
		fileExtension: string,
		mimeType: string,
	): Promise<{
		presignedUrl: string;
		s3Key: string;
		publicUrl: string;
	}> {
		const s3Key = `${env.providers.aws.s3.folders.notices}/${buildingId}/${noticeId}.${fileExtension}`;

		const presignedUrl = await this.s3Provider.getPresignedUrlForPut(
			s3Key,
			mimeType,
			300, // 5 minutes
		);
		const publicUrl = this.s3Provider.getPublicUrl(s3Key);

		return {
			presignedUrl,
			publicUrl,
			s3Key,
		};
	}

	public async getNoticesByBuildingId(
		buildingId: string,
		status?: NoticeStatusEnumType,
		page?: number,
		limit?: number,
	): Promise<
		HttpResponse<{
			data: Array<{
				_id: string;
				title: string;
				content: string;
				status: NoticeStatusEnumType;
				createdAt: Date;
			}>;
			total: number;
			page: number;
			limit: number;
			totalPages: number;
		}>
	> {
		const building = await this.buildingRepository.findById(buildingId);

		if (!building) {
			throw httpException("Edifício não encontrado", httpStatus.NOT_FOUND);
		}

		const pageNumber = page || 1;
		const limitNumber = limit || 10;

		const { notices, total } = await this.noticeRepository.listWithFilters(
			{
				buildingId,
				status,
			},
			pageNumber,
			limitNumber,
		);

		return {
			success: true,
			message: "Avisos encontrados com sucesso",
			data: {
				data: notices.map((notice) => ({
					_id: notice._id,
					title: notice.title,
					content: notice.content,
					status: notice.status,
					createdAt: notice.createdAt,
				})),
				total,
				page: pageNumber,
				limit: limitNumber,
				totalPages: Math.ceil(total / limitNumber),
			},
		};
	}

	public async getNoticeById(noticeId: string): Promise<
		HttpResponse<{
			_id: string;
			buildingId: string;
			title: string;
			content: string;
			fileName: string;
			fileSize: number;
			url: string;
			mimeType: string;
			status: NoticeStatusEnumType;
			createdAt: Date;
		}>
	> {
		const notice = await this.noticeRepository.findById(noticeId);

		if (!notice) {
			throw httpException("Aviso não encontrado", httpStatus.NOT_FOUND);
		}

		return {
			success: true,
			message: "Aviso encontrado com sucesso",
			data: {
				_id: notice._id,
				buildingId: notice.buildingId,
				title: notice.title,
				content: notice.content,
				fileName: notice.fileName,
				fileSize: notice.fileSize,
				url: notice.url,
				mimeType: notice.mimeType,
				status: notice.status,
				createdAt: notice.createdAt,
			},
		};
	}

	public async deleteNotice(
		noticeId: string,
		deletedNote: string,
		buildingId: string,
	): Promise<HttpResponse<null>> {
		const notice = await this.noticeRepository.findById(noticeId);

		if (!notice) {
			throw httpException("Aviso não encontrado", httpStatus.NOT_FOUND);
		}

		if (notice.buildingId !== buildingId) {
			throw httpException(
				"Aviso não pertence ao seu edifício",
				httpStatus.FORBIDDEN,
			);
		}

		if (notice.status !== "ATIVO") {
			throw httpException(
				"Apenas avisos ativos podem ser deletados",
				httpStatus.BAD_REQUEST,
			);
		}

		const deleted = await this.noticeRepository.delete(noticeId, deletedNote);

		if (!deleted) {
			throw httpException(
				"Erro ao deletar aviso",
				httpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		return {
			success: true,
			message: "Aviso deletado com sucesso",
			data: null,
		};
	}

	private async sendNotificationToResidentsAsync(
		buildingId: string,
		noticeTitle: string,
		noticeContent: string,
		noticeUrl: string,
		hasAttachment: boolean,
	): Promise<void> {
		try {
			const building = await this.buildingRepository.findById(buildingId);
			if (!building) {
				console.error(`❌ Building ${buildingId} not found for notification`);
				return;
			}

			const residents = await this.residentRepository.findMany({
				buildingId,
				status: ResidentStatusEnum.ATIVO,
			});

			if (residents.length === 0) {
				console.log(`ℹ️ No active residents found in building ${buildingId}`);
				return;
			}

			const noticeEmail = new NoticeEmail();
			// URL do aviso no frontend - aponta para a página de avisos do residente
			// A URL pode ser ajustada conforme a configuração do frontend
			const frontendBaseUrl =
				process.env.FRONTEND_URL || "http://localhost:8080";
			const frontendUrl = `${frontendBaseUrl}/notices`;

			for (const resident of residents) {
				noticeEmail.sendNoticeNotificationEmailAsync(
					resident.email,
					resident.name,
					building.name,
					noticeTitle,
					noticeContent,
					frontendUrl,
					hasAttachment,
				);
			}

			console.log(
				`✅ Notice notification sent to ${residents.length} residents`,
			);
		} catch (error) {
			console.error(`❌ Error sending notice notifications: ${error}`);
		}
	}
}
