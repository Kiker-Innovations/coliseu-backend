import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import { httpException } from "../../../config/error";
import { UserTypeEnum } from "../../enum/userType.enum";
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

	public async getPendingPackages(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.CONCIERGE) {
			throw httpException(
				"Apenas porteiros podem visualizar encomendas pendentes",
				httpStatus.FORBIDDEN,
			);
		}

		const buildingId = request.user.buildingId;

		return reply
			.status(httpStatus.OK)
			.send(await this.packageService.getPendingPackages(buildingId));
	}

	public async getDeliveredPackages(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.CONCIERGE) {
			throw httpException(
				"Apenas porteiros podem visualizar encomendas entregues",
				httpStatus.FORBIDDEN,
			);
		}

		const buildingId = request.user.buildingId;

		return reply
			.status(httpStatus.OK)
			.send(await this.packageService.getDeliveredPackages(buildingId));
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

	public async getCancelledPackages(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.CONCIERGE) {
			throw httpException(
				"Apenas porteiros podem visualizar encomendas canceladas",
				httpStatus.FORBIDDEN,
			);
		}

		const buildingId = request.user.buildingId;
		const { days } = request.query as { days?: string };
		const daysNumber = days ? parseInt(days, 10) : 7;

		return reply
			.status(httpStatus.OK)
			.send(await this.packageService.getCancelledPackages(daysNumber, buildingId));
	}
}

