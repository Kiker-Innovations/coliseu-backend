import { randomUUID } from "node:crypto";
import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
	CreateFineEntity,
	FineEntity,
	UpdateFineEntity,
} from "../entity/fine.entity";
import type { IRepository } from "../interfaces/IRepository";
import { getDate } from "@/v1/utils/utils";

export class FineRepository
	implements
		IRepository<FineEntity, CreateFineEntity, UpdateFineEntity>
{
	private collection: Collection<FineEntity>;

	constructor(mongoClient: MongoClient) {
		const database = mongoClient.db(env.databases.mongodb.database);
		this.collection = database.collection<FineEntity>(
			env.databases.mongodb.collections.fines
		);
	}

	public async create(data: CreateFineEntity): Promise<FineEntity> {
		const now = getDate();
		const fineEntity: FineEntity = {
			_id: randomUUID(),
			...data,
			createdAt: now,
			updatedAt: now,
		};

		await this.collection.insertOne(fineEntity);
		return fineEntity;
	}

	public async findById(_id: string): Promise<FineEntity | null> {
		return await this.collection.findOne({ _id });
	}

	public async findOne(
		filter: Partial<FineEntity>
	): Promise<FineEntity | null> {
		return await this.collection.findOne(filter);
	}

	public async findMany(
		filter?: Partial<FineEntity>
	): Promise<FineEntity[]> {
		return await this.collection.find(filter || {}).toArray();
	}

	public async update(
		_id: string,
		data: UpdateFineEntity
	): Promise<FineEntity | null> {
		const updateData = {
			...data,
			updatedAt: getDate(),
		};

		const result = await this.collection.findOneAndUpdate(
			{ _id },
			{ $set: updateData },
			{ returnDocument: "after" }
		);

		return result || null;
	}

	public async delete(_id: string): Promise<boolean> {
		const result = await this.collection.deleteOne({ _id });
		return result.deletedCount > 0;
	}
}
