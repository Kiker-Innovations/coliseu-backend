import { randomUUID } from "node:crypto";
import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
	CreateConciergeEntity,
	ConciergeEntity,
	UpdateConciergeEntity,
} from "../entity/concierge.entity";
import type { IRepository } from "../interfaces/IRepository";

export class ConciergeRepository
	implements
		IRepository<ConciergeEntity, CreateConciergeEntity, UpdateConciergeEntity>
{
	private collection: Collection<ConciergeEntity>;

	constructor(mongoClient: MongoClient) {
		const database = mongoClient.db(env.databases.mongodb.database);
		this.collection = database.collection<ConciergeEntity>(
			env.databases.mongodb.collections.concierges,
		);
	}

	public async create(data: CreateConciergeEntity): Promise<ConciergeEntity> {
		const now = new Date();
		const conciergeEntity: ConciergeEntity = {
			_id: randomUUID(),
			...data,
			createdAt: now,
			updatedAt: now,
		};

		await this.collection.insertOne(conciergeEntity);
		return conciergeEntity;
	}

	public async findById(_id: string): Promise<ConciergeEntity | null> {
		return await this.collection.findOne({ _id });
	}

	public async findOne(
		filter: Partial<ConciergeEntity>,
	): Promise<ConciergeEntity | null> {
		return await this.collection.findOne(filter);
	}

	public async findMany(
		filter?: Partial<ConciergeEntity>,
	): Promise<ConciergeEntity[]> {
		return await this.collection.find(filter || {}).toArray();
	}

	public async update(
		_id: string,
		data: UpdateConciergeEntity,
	): Promise<ConciergeEntity | null> {
		const updateData = {
			...data,
			updatedAt: new Date(),
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

	public async findByEmail(email: string): Promise<ConciergeEntity | null> {
		return await this.findOne({ email });
	}
}

