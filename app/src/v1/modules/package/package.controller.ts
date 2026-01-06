import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import { httpException } from "../../../config/error";
import { UserTypeEnum } from "../../enum/userType.enum";
import type { PackageStatusEnumType } from "../../enum/packageStatus.enum";
import {
	transformCreatePackageDto,
	transformConfirmDeliveryPackageDto,
	transformCancelPackageDto,
} from "./dto";
import { PackageService } from "./package.service";

export class PackageController {
	private packageService: PackageService;

	constructor(mongoClient: MongoClient) {
		this.packageService = new PackageService(mongoClient);
	}

	public async createPackage(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.CONCIERGE) {
			throw httpException(
				"Apenas porteiros podem criar encomendas",
				httpStatus.FORBIDDEN,
			);
		}

		const conciergeId = request.user.userId;
		const buildingId = request.user.buildingId;

		return reply
			.code(httpStatus.CREATED)
			.send(
				await this.packageService.createPackage(
					transformCreatePackageDto(request.body),
					conciergeId,
					buildingId,
				),
			);
	}

	public async getPackages(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.CONCIERGE) {
			throw httpException(
				"Apenas porteiros podem visualizar encomendas",
				httpStatus.FORBIDDEN,
			);
		}

		const buildingId = request.user.buildingId;
		const { status, days } = request.query as {
			status?: string;
			days?: string;
		};
		const daysNumber = days ? parseInt(days, 10) : undefined;

		return reply
			.status(httpStatus.OK)
			.send(
				await this.packageService.getPackages(
					buildingId,
					status as PackageStatusEnumType | undefined,
					daysNumber,
				),
			);
	}

	public async getPackageById(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.CONCIERGE) {
			throw httpException(
				"Apenas porteiros podem visualizar encomendas",
				httpStatus.FORBIDDEN,
			);
		}

		const { id } = request.params as { id: string };
		const buildingId = request.user.buildingId;

		return reply
			.status(httpStatus.OK)
			.send(await this.packageService.getPackageById(id, buildingId));
	}

	public async confirmDelivery(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.CONCIERGE) {
			throw httpException(
				"Apenas porteiros podem confirmar entregas",
				httpStatus.FORBIDDEN,
			);
		}

		const conciergeId = request.user.userId;
		const buildingId = request.user.buildingId;
		const { id } = request.params as { id: string };

		return reply
			.status(httpStatus.OK)
			.send(
				await this.packageService.confirmDelivery(
					id,
					transformConfirmDeliveryPackageDto(request.body),
					conciergeId,
					buildingId,
				),
			);
	}

	public async getPackageStats(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.CONCIERGE) {
			throw httpException(
				"Apenas porteiros podem visualizar estatísticas",
				httpStatus.FORBIDDEN,
			);
		}

		const buildingId = request.user.buildingId;

		return reply
			.status(httpStatus.OK)
			.send(await this.packageService.getPackageStats(buildingId));
	}

	public async cancelPackage(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.CONCIERGE) {
			throw httpException(
				"Apenas porteiros podem cancelar encomendas",
				httpStatus.FORBIDDEN,
			);
		}

		const conciergeId = request.user.userId;
		const buildingId = request.user.buildingId;
		const { id } = request.params as { id: string };

		return reply
			.status(httpStatus.OK)
			.send(
				await this.packageService.cancelPackage(
					id,
					transformCancelPackageDto(request.body),
					conciergeId,
					buildingId,
				),
			);
	}

	public async getMyPackages(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.RESIDENT) {
			throw httpException(
				"Apenas moradores podem visualizar suas encomendas",
				httpStatus.FORBIDDEN,
			);
		}

		if (!request.user.apartmentId) {
			throw httpException(
				"Apartamento não encontrado no token",
				httpStatus.BAD_REQUEST,
			);
		}

		const { status } = request.query as { status?: string };

		return reply
			.status(httpStatus.OK)
			.send(
				await this.packageService.getMyPackages(
					request.user.apartmentId,
					status as PackageStatusEnumType | undefined,
				),
			);
	}

	public async getMyPackageStats(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.RESIDENT) {
			throw httpException(
				"Apenas moradores podem visualizar suas estatísticas",
				httpStatus.FORBIDDEN,
			);
		}

		if (!request.user.apartmentId) {
			throw httpException(
				"Apartamento não encontrado no token",
				httpStatus.BAD_REQUEST,
			);
		}

		return reply
			.status(httpStatus.OK)
			.send(
				await this.packageService.getMyPackageStats(request.user.apartmentId),
			);
	}
}
