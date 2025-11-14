import type { MongoClient } from "mongodb";
import type {
	CreatePackageEntity,
	PackageEntity,
} from "../../../database/mongodb/entity/package.entity";
import { PackageRepository } from "../../../database/mongodb/repositories/package.repository";
import { ApartmentRepository } from "../../../database/mongodb/repositories/apartment.repository";
import { ConciergeRepository } from "../../../database/mongodb/repositories/concierge.repository";
import type { PackageCreateDto, PackageConfirmDeliveryDto } from "./dto";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";
import { PackageStatusEnum } from "@/v1/enum/packageStatus.enum";
import { getDate } from "@/v1/utils/utils";

interface PendingPackageListItem {
	_id: string;
	ownerName: string;
	description: string;
	apartmentNumber: string;
	receiverDate: Date;
	receiverConciergeName: string;
}

interface DeliveredPackageListItem {
	_id: string;
	ownerName: string;
	description: string;
	apartmentNumber: string;
	deliveryDate: Date;
	recipientName: string;
	deliveryConciergeName: string;
}

export class PackageService {
	private packageRepository: PackageRepository;
	private apartmentRepository: ApartmentRepository;
	private conciergeRepository: ConciergeRepository;

	constructor(mongoClient: MongoClient) {
		this.packageRepository = new PackageRepository(mongoClient);
		this.apartmentRepository = new ApartmentRepository(mongoClient);
		this.conciergeRepository = new ConciergeRepository(mongoClient);
	}

	public async createPackage(
		packageCreateDto: PackageCreateDto,
	): Promise<
		HttpResponse<{
			id: string;
			ownerName: string;
			description: string;
		}>
	> {
		// Verify apartment exists
		const apartment = await this.apartmentRepository.findById(
			packageCreateDto.apartmentId,
		);
		if (!apartment) {
			throw httpException(
				"Apartamento não encontrado",
				httpStatus.NOT_FOUND,
			);
		}

		// Verify concierge exists
		const concierge = await this.conciergeRepository.findById(
			packageCreateDto.receiverConciergeId,
		);
		if (!concierge) {
			throw httpException("Porteiro não encontrado", httpStatus.NOT_FOUND);
		}

		const packageEntity: CreatePackageEntity = {
			apartmentId: packageCreateDto.apartmentId,
			receiverConciergeId: packageCreateDto.receiverConciergeId,
			ownerName: packageCreateDto.ownerName,
			description: packageCreateDto.description,
			receiverDate: packageCreateDto.receiverDate,
			status: PackageStatusEnum.PENDENTE,
		};

		const createdPackage = await this.packageRepository.create(packageEntity);

		return {
			success: true,
			message: "Encomenda cadastrada com sucesso!",
			data: {
				id: createdPackage._id,
				ownerName: createdPackage.ownerName,
				description: createdPackage.description,
			},
		};
	}

	public async getPendingPackages(): Promise<
		HttpResponse<PendingPackageListItem[]>
	> {
		const packages = await this.packageRepository.findPending();

		const packagesWithDetails = await Promise.all(
			packages.map(async (pkg) => {
				const apartment = await this.apartmentRepository.findById(
					pkg.apartmentId,
				);
				const concierge = await this.conciergeRepository.findById(
					pkg.receiverConciergeId,
				);

				return {
					_id: pkg._id,
					ownerName: pkg.ownerName,
					description: pkg.description,
					apartmentNumber: apartment?.number || "N/A",
					receiverDate: pkg.receiverDate,
					receiverConciergeName: concierge?.name || "N/A",
				};
			}),
		);

		return {
			success: true,
			message: "Encomendas pendentes encontradas com sucesso",
			data: packagesWithDetails,
		};
	}

	public async getDeliveredPackages(): Promise<
		HttpResponse<DeliveredPackageListItem[]>
	> {
		const packages = await this.packageRepository.findDelivered();

		const packagesWithDetails = await Promise.all(
			packages.map(async (pkg) => {
				const apartment = await this.apartmentRepository.findById(
					pkg.apartmentId,
				);
				const concierge = pkg.deliveryConciergeId
					? await this.conciergeRepository.findById(
							pkg.deliveryConciergeId,
						)
					: null;

				return {
					_id: pkg._id,
					ownerName: pkg.ownerName,
					description: pkg.description,
					apartmentNumber: apartment?.number || "N/A",
					deliveryDate: pkg.deliveryDate || new Date(),
					recipientName: pkg.recipientName || "N/A",
					deliveryConciergeName: concierge?.name || "N/A",
				};
			}),
		);

		return {
			success: true,
			message: "Encomendas entregues encontradas com sucesso",
			data: packagesWithDetails,
		};
	}

	public async getPackageById(packageId: string): Promise<
		HttpResponse<PackageEntity & { apartmentNumber?: string; receiverConciergeName?: string; deliveryConciergeName?: string }>
	> {
		const packageEntity = await this.packageRepository.findById(packageId);

		if (!packageEntity) {
			throw httpException("Encomenda não encontrada", httpStatus.NOT_FOUND);
		}

		const apartment = await this.apartmentRepository.findById(
			packageEntity.apartmentId,
		);
		const receiverConcierge = await this.conciergeRepository.findById(
			packageEntity.receiverConciergeId,
		);
		const deliveryConcierge = packageEntity.deliveryConciergeId
			? await this.conciergeRepository.findById(
					packageEntity.deliveryConciergeId,
				)
			: null;

		return {
			success: true,
			message: "Encomenda encontrada com sucesso",
			data: {
				...packageEntity,
				apartmentNumber: apartment?.number,
				receiverConciergeName: receiverConcierge?.name,
				deliveryConciergeName: deliveryConcierge?.name,
			},
		};
	}

	public async confirmDelivery(
		packageId: string,
		confirmDeliveryDto: PackageConfirmDeliveryDto,
	): Promise<HttpResponse<PackageEntity>> {
		const packageEntity = await this.packageRepository.findById(packageId);

		if (!packageEntity) {
			throw httpException("Encomenda não encontrada", httpStatus.NOT_FOUND);
		}

		if (packageEntity.status === PackageStatusEnum.ENTREGUE) {
			throw httpException(
				"Encomenda já foi entregue",
				httpStatus.BAD_REQUEST,
			);
		}

		// Verify concierge exists
		const concierge = await this.conciergeRepository.findById(
			confirmDeliveryDto.deliveryConciergeId,
		);
		if (!concierge) {
			throw httpException("Porteiro não encontrado", httpStatus.NOT_FOUND);
		}

		const updatedPackage = await this.packageRepository.update(packageId, {
			recipientName: confirmDeliveryDto.recipientName,
			deliveryConciergeId: confirmDeliveryDto.deliveryConciergeId,
			deliveryDate: getDate(),
			status: PackageStatusEnum.ENTREGUE,
		});

		if (!updatedPackage) {
			throw httpException(
				"Erro ao confirmar entrega",
				httpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		return {
			success: true,
			message: "Entrega confirmada com sucesso",
			data: updatedPackage,
		};
	}
}

