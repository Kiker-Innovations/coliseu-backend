import { randomUUID } from "node:crypto";
import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
	CreatePackageEntity,
	PackageEntity,
	UpdatePackageEntity,
} from "../entity/package.entity";
import type { IRepository } from "../interfaces/IRepository";
import { getDate } from "@/v1/utils/utils";
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

	public async findPending(): Promise<PackageEntity[]> {
		return await this.collection
			.find({ status: PackageStatusEnum.PENDENTE })
			.toArray();
	}

	public async findDelivered(): Promise<PackageEntity[]> {
		return await this.collection
			.find({ status: PackageStatusEnum.ENTREGUE })
			.toArray();
	}
}

