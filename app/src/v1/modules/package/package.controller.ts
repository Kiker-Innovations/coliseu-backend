import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import {
	transformCreatePackageDto,
	transformConfirmDeliveryPackageDto,
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
		return reply
			.code(httpStatus.CREATED)
			.send(
				await this.packageService.createPackage(
					transformCreatePackageDto(request.body),
				),
			);
	}

	public async getPendingPackages(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		return reply
			.status(httpStatus.OK)
			.send(await this.packageService.getPendingPackages());
	}

	public async getDeliveredPackages(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		return reply
			.status(httpStatus.OK)
			.send(await this.packageService.getDeliveredPackages());
	}

	public async getPackageById(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const { id } = request.params as { id: string };
		return reply
			.status(httpStatus.OK)
			.send(await this.packageService.getPackageById(id));
	}

	public async confirmDelivery(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const { id } = request.params as { id: string };
		return reply
			.status(httpStatus.OK)
			.send(
				await this.packageService.confirmDelivery(
					id,
					transformConfirmDeliveryPackageDto(request.body),
				),
			);
	}
}

