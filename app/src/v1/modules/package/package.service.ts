import type { MongoClient } from "mongodb";
import type {
	CreatePackageEntity,
	PackageEntity,
} from "../../../database/mongodb/entity/package.entity";
import { PackageRepository } from "../../../database/mongodb/repositories/package.repository";
import { ApartmentRepository } from "../../../database/mongodb/repositories/apartment.repository";
import { ConciergeRepository } from "../../../database/mongodb/repositories/concierge.repository";
import { ResidentRepository } from "../../../database/mongodb/repositories/resident.repository";
import { BuildingRepository } from "../../../database/mongodb/repositories/building.repository";
import type {
	PackageCreateDto,
	PackageConfirmDeliveryDto,
	PackageCancelDto,
} from "./dto";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";
import {
	PackageStatusEnum,
	type PackageStatusEnumType,
} from "@/v1/enum/packageStatus.enum";
import { ResidentStatusEnum } from "@/v1/enum/residentStatus.enum";
import { getDate, formatDate } from "@/v1/utils/utils";
import { sendPackageArrivalEmail } from "@/v1/utils/emailHelper";

interface PackageListItem {
	_id: string;
	ownerName: string;
	description: string;
	courierName?: string;
	apartmentNumber: string;
	apartmentFloor?: number;
	apartmentBlock?: string;
	receiverDate: Date;
	receiverBy?: string;
	deliveryDate?: Date;
	recipientName?: string;
	deliveryBy?: string;
	cancelReason?: string;
	canceledBy?: string;
	cancelledAt?: Date;
}

export class PackageService {
	private packageRepository: PackageRepository;
	private apartmentRepository: ApartmentRepository;
	private conciergeRepository: ConciergeRepository;
	private residentRepository: ResidentRepository;
	private buildingRepository: BuildingRepository;

	constructor(mongoClient: MongoClient) {
		this.packageRepository = new PackageRepository(mongoClient);
		this.apartmentRepository = new ApartmentRepository(mongoClient);
		this.conciergeRepository = new ConciergeRepository(mongoClient);
		this.residentRepository = new ResidentRepository(mongoClient);
		this.buildingRepository = new BuildingRepository(mongoClient);
	}

	public async createPackage(
		packageCreateDto: PackageCreateDto,
		conciergeId: string,
		buildingId: string,
	): Promise<
		HttpResponse<{
			id: string;
			ownerName?: string;
			description?: string;
			courierName?: string;
		}>
	> {
		// Verify apartment exists
		const apartment = await this.apartmentRepository.findById(
			packageCreateDto.apartmentId,
		);
		if (!apartment) {
			throw httpException("Apartamento não encontrado", httpStatus.NOT_FOUND);
		}

		// Verify apartment belongs to the same building
		if (apartment.buildingId !== buildingId) {
			throw httpException(
				"O apartamento não pertence ao mesmo edifício do porteiro",
				httpStatus.FORBIDDEN,
			);
		}

		// Verify concierge exists and belongs to the same building
		const concierge = await this.conciergeRepository.findById(conciergeId);
		if (!concierge) {
			throw httpException("Porteiro não encontrado", httpStatus.NOT_FOUND);
		}

		if (concierge.buildingId !== buildingId) {
			throw httpException(
				"O porteiro não pertence ao mesmo edifício",
				httpStatus.FORBIDDEN,
			);
		}

		const packageEntity: CreatePackageEntity = {
			apartmentId: packageCreateDto.apartmentId,
			buildingId: buildingId,
			receiverBy: concierge.name,
			ownerName: packageCreateDto.ownerName,
			description: packageCreateDto.description,
			courierName: packageCreateDto.courierName,
			receiverDate: packageCreateDto.receiverDate,
			status: PackageStatusEnum.PENDENTE,
		};

		const createdPackage = await this.packageRepository.create(packageEntity);

		// Send email notifications to residents
		this.sendPackageArrivalNotificationsAsync(
			packageCreateDto.apartmentId,
			createdPackage.receiverDate,
			createdPackage.description,
		);

		return {
			success: true,
			message: "Encomenda cadastrada com sucesso!",
			data: {
				id: createdPackage._id,
				ownerName: createdPackage.ownerName,
				description: createdPackage.description,
				courierName: createdPackage.courierName,
			},
		};
	}

	private async sendPackageArrivalNotificationsAsync(
		apartmentId: string,
		receiverDate: Date,
		description?: string,
	): Promise<void> {
		try {
			// Get apartment by apartmentId
			const apartment = await this.apartmentRepository.findById(apartmentId);
			if (!apartment) {
				console.error(
					`❌ Apartment não encontrado para apartmentId: ${apartmentId}`,
				);
				return;
			}

			// Get building information using buildingId from apartment
			const building = await this.buildingRepository.findById(
				apartment.buildingId,
			);
			if (!building) {
				console.error(
					`❌ Building não encontrado para buildingId: ${apartment.buildingId}`,
				);
				return;
			}

			// Find all residents for this apartment using apartmentId
			const residents = await this.residentRepository.findMany({
				apartmentId: apartmentId,
			});

			if (residents.length === 0) {
				console.log(
					`ℹ️ Nenhum resident encontrado para o apartamento ${apartment.number} (bloco ${apartment.block})`,
				);
				return;
			}

			// Format date in Brazilian format
			const formattedDate = formatDate(receiverDate, "DD/MM/YYYY [às] HH:mm");

			// Format apartment number with block if available
			const apartmentDisplay = apartment.block
				? `${apartment.block} - ${apartment.number}`
				: apartment.number;

			// Send email to each resident
			const emailPromises = residents.map((resident) => {
				// Only send to active residents
				if (resident.status !== ResidentStatusEnum.ATIVO) {
					return Promise.resolve();
				}

				return sendPackageArrivalEmail(
					resident.email,
					resident.name,
					building.name,
					apartmentDisplay,
					formattedDate,
					description,
				);
			});

			await Promise.all(emailPromises);
		} catch (error) {
			console.error(
				"❌ Erro ao enviar notificações de entrega por e-mail:",
				error,
			);
		}
	}

	public async getPackages(
		buildingId: string,
		status?: PackageStatusEnumType,
		days?: number,
	): Promise<HttpResponse<PackageListItem[]>> {
		let packages: PackageEntity[];

		if (status === PackageStatusEnum.PENDENTE) {
			packages = await this.packageRepository.findPending(buildingId);
		} else if (status === PackageStatusEnum.ENTREGUE) {
			packages =
				await this.packageRepository.findDeliveredLast7Days(buildingId);
		} else if (status === PackageStatusEnum.CANCELADO) {
			const daysToUse = days || 7;
			packages = await this.packageRepository.findCancelledLastDays(
				daysToUse,
				buildingId,
			);
		} else {
			packages = await this.packageRepository.findMany({ buildingId });
		}

		const packagesWithDetails = await Promise.all(
			packages.map(async (pkg) => {
				const apartment = await this.apartmentRepository.findById(
					pkg.apartmentId,
				);

				const baseItem: PackageListItem = {
					_id: pkg._id,
					ownerName: pkg.ownerName || "N/A",
					description: pkg.description || "N/A",
					courierName: pkg.courierName,
					apartmentNumber: apartment?.number || "N/A",
					apartmentFloor: apartment?.floor,
					apartmentBlock: apartment?.block,
					receiverDate: pkg.receiverDate,
				};

				if (pkg.receiverBy) {
					baseItem.receiverBy = pkg.receiverBy;
				}

				if (pkg.deliveryDate) {
					baseItem.deliveryDate = pkg.deliveryDate;
				}

				if (pkg.recipientName) {
					baseItem.recipientName = pkg.recipientName;
				}

				if (pkg.deliveryBy) {
					baseItem.deliveryBy = pkg.deliveryBy;
				}

				if (pkg.cancelReason) {
					baseItem.cancelReason = pkg.cancelReason;
				}

				if (pkg.canceledBy) {
					baseItem.canceledBy = pkg.canceledBy;
				}

				if (pkg.cancelledAt) {
					baseItem.cancelledAt = pkg.cancelledAt;
				}

				return baseItem;
			}),
		);

		let message = "Encomendas encontradas com sucesso";
		if (status === PackageStatusEnum.PENDENTE) {
			message = "Encomendas pendentes encontradas com sucesso";
		} else if (status === PackageStatusEnum.ENTREGUE) {
			message = "Encomendas entregues encontradas com sucesso";
		} else if (status === PackageStatusEnum.CANCELADO) {
			message = "Encomendas canceladas encontradas com sucesso";
		}

		return {
			success: true,
			message,
			data: packagesWithDetails,
		};
	}

	public async getPackageById(
		packageId: string,
		buildingId: string,
	): Promise<
		HttpResponse<
			PackageEntity & {
				apartmentNumber?: string;
				apartmentFloor?: number;
				apartmentBlock?: string;
			}
		>
	> {
		const packageEntity = await this.packageRepository.findById(packageId);

		if (!packageEntity) {
			throw httpException("Encomenda não encontrada", httpStatus.NOT_FOUND);
		}

		// Verify package belongs to the same building
		if (packageEntity.buildingId !== buildingId) {
			throw httpException(
				"Encomenda não pertence ao mesmo edifício do porteiro",
				httpStatus.FORBIDDEN,
			);
		}

		const apartment = await this.apartmentRepository.findById(
			packageEntity.apartmentId,
		);

		return {
			success: true,
			message: "Encomenda encontrada com sucesso",
			data: {
				...packageEntity,
				apartmentNumber: apartment?.number,
				apartmentFloor: apartment?.floor,
				apartmentBlock: apartment?.block,
			},
		};
	}

	public async confirmDelivery(
		packageId: string,
		confirmDeliveryDto: PackageConfirmDeliveryDto,
		conciergeId: string,
		buildingId: string,
	): Promise<HttpResponse<PackageEntity>> {
		const packageEntity = await this.packageRepository.findById(packageId);

		if (!packageEntity) {
			throw httpException("Encomenda não encontrada", httpStatus.NOT_FOUND);
		}

		// Verify package belongs to the same building
		if (packageEntity.buildingId !== buildingId) {
			throw httpException(
				"Encomenda não pertence ao mesmo edifício do porteiro",
				httpStatus.FORBIDDEN,
			);
		}

		if (packageEntity.status === PackageStatusEnum.ENTREGUE) {
			throw httpException("Encomenda já foi entregue", httpStatus.BAD_REQUEST);
		}

		// Verify concierge exists and belongs to the same building
		const concierge = await this.conciergeRepository.findById(conciergeId);
		if (!concierge) {
			throw httpException("Porteiro não encontrado", httpStatus.NOT_FOUND);
		}

		if (concierge.buildingId !== buildingId) {
			throw httpException(
				"O porteiro não pertence ao mesmo edifício",
				httpStatus.FORBIDDEN,
			);
		}

		const updatedPackage = await this.packageRepository.update(packageId, {
			recipientName: confirmDeliveryDto.recipientName,
			deliveryBy: concierge.name,
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

	public async getPackageStats(buildingId: string): Promise<
		HttpResponse<{
			totalPendings: number;
			totalConfirmed: number;
			totalPendingsWeek: number;
		}>
	> {
		const [totalPendings, totalConfirmed, totalPendingsWeek] =
			await Promise.all([
				this.packageRepository.countPending(buildingId),
				this.packageRepository.countDeliveredToday(buildingId),
				this.packageRepository.countDeliveredThisWeek(buildingId),
			]);

		return {
			success: true,
			message: "Estatísticas de encomendas obtidas com sucesso",
			data: {
				totalPendings,
				totalConfirmed,
				totalPendingsWeek,
			},
		};
	}

	public async cancelPackage(
		packageId: string,
		cancelDto: PackageCancelDto,
		conciergeId: string,
		buildingId: string,
	): Promise<HttpResponse<PackageEntity>> {
		const packageEntity = await this.packageRepository.findById(packageId);

		if (!packageEntity) {
			throw httpException("Encomenda não encontrada", httpStatus.NOT_FOUND);
		}

		// Verify package belongs to the same building
		if (packageEntity.buildingId !== buildingId) {
			throw httpException(
				"Encomenda não pertence ao mesmo edifício do porteiro",
				httpStatus.FORBIDDEN,
			);
		}

		if (packageEntity.status === PackageStatusEnum.ENTREGUE) {
			throw httpException(
				"Encomenda já foi entregue e não pode ser cancelada",
				httpStatus.BAD_REQUEST,
			);
		}

		if (packageEntity.status === PackageStatusEnum.CANCELADO) {
			throw httpException("Encomenda já foi cancelada", httpStatus.BAD_REQUEST);
		}

		// Verify concierge exists and belongs to the same building
		const concierge = await this.conciergeRepository.findById(conciergeId);
		if (!concierge) {
			throw httpException("Porteiro não encontrado", httpStatus.NOT_FOUND);
		}

		if (concierge.buildingId !== buildingId) {
			throw httpException(
				"O porteiro não pertence ao mesmo edifício",
				httpStatus.FORBIDDEN,
			);
		}

		const updatedPackage = await this.packageRepository.update(packageId, {
			status: PackageStatusEnum.CANCELADO,
			cancelReason: cancelDto.cancelReason,
			canceledBy: concierge.name,
			cancelledAt: getDate(),
		});

		if (!updatedPackage) {
			throw httpException(
				"Erro ao cancelar encomenda",
				httpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		return {
			success: true,
			message: "Encomenda cancelada com sucesso",
			data: updatedPackage,
		};
	}

	public async getMyPackages(
		apartmentId: string,
		status?: PackageStatusEnumType,
	): Promise<
		HttpResponse<
			(PackageEntity & {
				apartmentNumber?: string;
				apartmentFloor?: number;
				apartmentBlock?: string;
			})[]
		>
	> {
		let packages: PackageEntity[];

		if (status) {
			if (status === PackageStatusEnum.PENDENTE) {
				packages =
					await this.packageRepository.findPendingByApartmentId(apartmentId);
			} else if (status === PackageStatusEnum.ENTREGUE) {
				packages =
					await this.packageRepository.findDeliveredByApartmentId(apartmentId);
			} else if (status === PackageStatusEnum.CANCELADO) {
				packages = await this.packageRepository.findMany({
					apartmentId,
					status: PackageStatusEnum.CANCELADO,
				});
			} else {
				packages = await this.packageRepository.findByApartmentId(apartmentId);
			}
		} else {
			packages = await this.packageRepository.findByApartmentId(apartmentId);
		}

		// Get apartment info for all packages
		const apartment = await this.apartmentRepository.findById(apartmentId);
		const packagesWithDetails = packages.map((pkg) => ({
			...pkg,
			apartmentNumber: apartment?.number,
			apartmentFloor: apartment?.floor,
			apartmentBlock: apartment?.block,
		}));

		const statusMessage = status
			? `Encomendas com status ${status} encontradas com sucesso`
			: "Encomendas encontradas com sucesso";

		return {
			success: true,
			message: statusMessage,
			data: packagesWithDetails,
		};
	}

	public async getMyPackageStats(apartmentId: string): Promise<
		HttpResponse<{
			totalAguardandoRetiradaMes: number;
			totalEntregues: number;
			totalAguardandoRetirada: number;
		}>
	> {
		const [
			totalAguardandoRetiradaMes,
			totalEntregues,
			totalAguardandoRetirada,
		] = await Promise.all([
			this.packageRepository.countPendingThisMonthByApartmentId(apartmentId),
			this.packageRepository.countDeliveredAllByApartmentId(apartmentId),
			this.packageRepository.countPendingAllByApartmentId(apartmentId),
		]);

		return {
			success: true,
			message: "Estatísticas de encomendas obtidas com sucesso",
			data: {
				totalAguardandoRetiradaMes,
				totalEntregues,
				totalAguardandoRetirada,
			},
		};
	}
}
