import { randomUUID } from "node:crypto";
import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
	CreatePackageEntity,
	PackageEntity,
	UpdatePackageEntity,
} from "../entity/package.entity";
import type { IRepository } from "../interfaces/IRepository";
import { getDate, toDate } from "@/v1/utils/utils";
import { PackageStatusEnum } from "@/v1/enum/packageStatus.enum";

export class PackageRepository
	implements
		IRepository<PackageEntity, CreatePackageEntity, UpdatePackageEntity>
{
	private collection: Collection<PackageEntity>;

	constructor(mongoClient: MongoClient) {
		const database = mongoClient.db(env.databases.mongodb.database);
		this.collection = database.collection<PackageEntity>(
			env.databases.mongodb.collections.packages,
		);
	}

	public async create(data: CreatePackageEntity): Promise<PackageEntity> {
		const now = getDate();
		const packageEntity: PackageEntity = {
			_id: randomUUID(),
			...data,
			status: PackageStatusEnum.PENDENTE,
			createdAt: now,
			updatedAt: now,
		};

		await this.collection.insertOne(packageEntity);
		return packageEntity;
	}

	public async findById(_id: string): Promise<PackageEntity | null> {
		return await this.collection.findOne({ _id });
	}

	public async findOne(
		filter: Partial<PackageEntity>,
	): Promise<PackageEntity | null> {
		return await this.collection.findOne(filter);
	}

	public async findMany(
		filter?: Partial<PackageEntity>,
	): Promise<PackageEntity[]> {
		return await this.collection.find(filter || {}).toArray();
	}

	public async update(
		_id: string,
		data: UpdatePackageEntity,
	): Promise<PackageEntity | null> {
		const updateData = {
			...data,
			updatedAt: getDate(),
		};

		const result = await this.collection.findOneAndUpdate(
			{ _id },
			{ $set: updateData },
			{ returnDocument: "after" },
		);

		return result || null;
	}

	public async delete(_id: string): Promise<boolean> {
		const result = await this.collection.deleteOne({ _id });
		return result.deletedCount > 0;
	}

	public async findPending(buildingId: string): Promise<PackageEntity[]> {
		return await this.collection
			.find({
				status: PackageStatusEnum.PENDENTE,
				buildingId: buildingId,
			})
			.toArray();
	}

	public async findDelivered(buildingId: string): Promise<PackageEntity[]> {
		return await this.collection
			.find({
				status: PackageStatusEnum.ENTREGUE,
				buildingId: buildingId,
			})
			.toArray();
	}

	public async findDeliveredLast7Days(
		buildingId: string,
	): Promise<PackageEntity[]> {
		const now = getDate();
		const sevenDaysAgo = toDate(now).subtract(7, "day").startOf("day").toDate();

		return await this.collection
			.find({
				status: PackageStatusEnum.ENTREGUE,
				buildingId: buildingId,
				deliveryDate: {
					$gte: sevenDaysAgo,
				},
			})
			.toArray();
	}

	public async countPending(buildingId: string): Promise<number> {
		return await this.collection.countDocuments({
			status: PackageStatusEnum.PENDENTE,
			buildingId: buildingId,
		});
	}

	public async countDeliveredToday(buildingId: string): Promise<number> {
		const now = getDate();
		const today = toDate(now).startOf("day").toDate();
		const tomorrow = toDate(now).add(1, "day").startOf("day").toDate();

		return await this.collection.countDocuments({
			status: PackageStatusEnum.ENTREGUE,
			buildingId: buildingId,
			deliveryDate: {
				$gte: today,
				$lt: tomorrow,
			},
		});
	}

	public async countDeliveredThisWeek(buildingId: string): Promise<number> {
		const now = getDate();
		const currentDate = toDate(now);
		const dayOfWeek = currentDate.day();

		const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
		const startOfWeek = currentDate
			.subtract(daysToMonday, "day")
			.startOf("day")
			.toDate();
		const endOfWeek = toDate(startOfWeek).add(7, "day").toDate();

		return await this.collection.countDocuments({
			status: PackageStatusEnum.ENTREGUE,
			buildingId: buildingId,
			deliveryDate: {
				$gte: startOfWeek,
				$lt: endOfWeek,
			},
		});
	}

	public async findCancelledLastDays(
		days: number,
		buildingId: string,
	): Promise<PackageEntity[]> {
		const now = getDate();
		const startDate = toDate(now).subtract(days, "day").startOf("day").toDate();

		return await this.collection
			.find({
				status: PackageStatusEnum.CANCELADO,
				buildingId: buildingId,
				cancelledAt: {
					$gte: startDate,
				},
			})
			.sort({ cancelledAt: -1 })
			.toArray();
	}

	public async findByApartmentId(
		apartmentId: string,
	): Promise<PackageEntity[]> {
		return await this.collection
			.find({ apartmentId })
			.sort({ receiverDate: -1 })
			.toArray();
	}

	public async findPendingByApartmentId(
		apartmentId: string,
	): Promise<PackageEntity[]> {
		return await this.collection
			.find({
				apartmentId,
				status: PackageStatusEnum.PENDENTE,
			})
			.sort({ receiverDate: -1 })
			.toArray();
	}

	public async findDeliveredByApartmentId(
		apartmentId: string,
	): Promise<PackageEntity[]> {
		return await this.collection
			.find({
				apartmentId,
				status: PackageStatusEnum.ENTREGUE,
			})
			.sort({ deliveryDate: -1 })
			.toArray();
	}

	public async countPendingThisMonthByApartmentId(
		apartmentId: string,
	): Promise<number> {
		const now = getDate();
		const startOfMonth = toDate(now).startOf("month").toDate();
		const endOfMonth = toDate(now).endOf("month").toDate();

		return await this.collection.countDocuments({
			apartmentId,
			status: PackageStatusEnum.PENDENTE,
			receiverDate: {
				$gte: startOfMonth,
				$lte: endOfMonth,
			},
		});
	}

	public async countDeliveredAllByApartmentId(
		apartmentId: string,
	): Promise<number> {
		return await this.collection.countDocuments({
			apartmentId,
			status: PackageStatusEnum.ENTREGUE,
		});
	}

	public async countPendingAllByApartmentId(
		apartmentId: string,
	): Promise<number> {
		return await this.collection.countDocuments({
			apartmentId,
			status: PackageStatusEnum.PENDENTE,
		});
	}
}
