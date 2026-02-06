import { randomUUID } from "node:crypto";
import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
	CreateUsefulContactEntity,
	UsefulContactEntity,
	UpdateUsefulContactEntity,
} from "../entity/usefulContact.entity";
import type { IRepository } from "../interfaces/IRepository";
import { getDate } from "@/v1/utils/utils";

export class UsefulContactRepository
	implements
		IRepository<
			UsefulContactEntity,
			CreateUsefulContactEntity,
			UpdateUsefulContactEntity
		>
{
	private collection: Collection<UsefulContactEntity>;

	constructor(mongoClient: MongoClient) {
		const database = mongoClient.db(env.databases.mongodb.database);
		this.collection = database.collection<UsefulContactEntity>(
			env.databases.mongodb.collections.usefulContacts,
		);
	}

	public async create(
		data: CreateUsefulContactEntity,
	): Promise<UsefulContactEntity> {
		const now = getDate();
		const usefulContactEntity: UsefulContactEntity = {
			_id: randomUUID(),
			...data,
			createdAt: now,
			updatedAt: now,
		};

		await this.collection.insertOne(usefulContactEntity);
		return usefulContactEntity;
	}

	public async findById(_id: string): Promise<UsefulContactEntity | null> {
		return await this.collection.findOne({
			_id,
			deletedAt: { $exists: false },
		});
	}

	public async findOne(
		filter: Partial<UsefulContactEntity>,
	): Promise<UsefulContactEntity | null> {
		return await this.collection.findOne({
			...filter,
			deletedAt: { $exists: false },
		});
	}

	public async findMany(
		filter?: Partial<UsefulContactEntity>,
	): Promise<UsefulContactEntity[]> {
		const query = filter
			? { ...filter, deletedAt: { $exists: false } }
			: { deletedAt: { $exists: false } };
		return await this.collection.find(query).toArray();
	}

	public async findManyByBuildingId(
		buildingId: string,
	): Promise<UsefulContactEntity[]> {
		return await this.collection
			.find({
				buildingId,
				deletedAt: { $exists: false },
			})
			.sort({ createdAt: -1 })
			.toArray();
	}

	public async update(
		_id: string,
		data: UpdateUsefulContactEntity,
	): Promise<UsefulContactEntity | null> {
		const now = getDate();
		const updateData = {
			...data,
			updatedAt: now,
		};

		const result = await this.collection.findOneAndUpdate(
			{ _id, deletedAt: { $exists: false } },
			{ $set: updateData },
			{ returnDocument: "after" },
		);

		return result || null;
	}

	public async delete(_id: string): Promise<boolean> {
		const result = await this.collection.deleteOne({ _id });
		return result.deletedCount > 0;
	}
}
