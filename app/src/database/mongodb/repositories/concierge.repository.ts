import { Collection, MongoClient } from "mongodb";
import {
	ConciergeEntity,
	CreateConciergeEntity,
	UpdateConciergeEntity,
} from "../entity/concierge.entity";
import { IRepository } from "../interfaces/IRepository";
import { env } from "@/config/env";
import { randomUUID } from "node:crypto";
import { getDate } from "@/v1/utils/utils";

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
		const now = getDate();
		const conciergeEntity: ConciergeEntity = {
			_id: randomUUID(),
			...data,
			createdAt: now,
			updatedAt: now,
		};

		await this.collection.insertOne(conciergeEntity);
		return conciergeEntity;
	}

	public async findByEmail(email: string): Promise<ConciergeEntity | null> {
		return await this.findOne({ email });
	}

	public async findById(_id: string): Promise<ConciergeEntity | null> {
		return await this.collection.findOne({
			_id,
			deletedAt: { $exists: false },
		});
	}

	public async findOne(
		filter: Partial<ConciergeEntity>,
	): Promise<ConciergeEntity | null> {
		return await this.collection.findOne({
			...filter,
			deletedAt: { $exists: false },
		});
	}

	public async findMany(): Promise<ConciergeEntity[]> {
		return await this.collection
			.find({
				deletedAt: { $exists: false },
			})
			.toArray();
	}

	public async findManyByBuildingId(
		buildingId: string,
	): Promise<ConciergeEntity[]> {
		return await this.collection
			.find({
				buildingId,
				deletedAt: { $exists: false },
			})
			.toArray();
	}

	public async update(
		_id: string,
		data: UpdateConciergeEntity,
	): Promise<ConciergeEntity | null> {
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

	public async updateByEmail(
		email: string,
		data: UpdateConciergeEntity,
	): Promise<ConciergeEntity | null> {
		const updateData = {
			...data,
			updatedAt: getDate(),
		};

		const result = await this.collection.findOneAndUpdate(
			{ email },
			{ $set: updateData },
			{ returnDocument: "after" },
		);

		return result || null;
	}
}
