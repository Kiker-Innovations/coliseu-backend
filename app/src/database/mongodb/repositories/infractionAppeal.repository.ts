import { randomUUID } from "node:crypto";
import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
	CreateInfractionAppealEntity,
	InfractionAppealEntity,
	UpdateInfractionAppealEntity,
} from "../entity/infractionAppeal.entity";
import type { IRepository } from "../interfaces/IRepository";
import { getDate } from "@/v1/utils/utils";

export class InfractionAppealRepository
	implements
		IRepository<
			InfractionAppealEntity,
			CreateInfractionAppealEntity,
			UpdateInfractionAppealEntity
		>
{
	private collection: Collection<InfractionAppealEntity>;

	constructor(mongoClient: MongoClient) {
		const database = mongoClient.db(env.databases.mongodb.database);
		this.collection = database.collection<InfractionAppealEntity>(
			env.databases.mongodb.collections.infractionAppeals
		);
	}

	public async create(
		data: CreateInfractionAppealEntity
	): Promise<InfractionAppealEntity> {
		const now = getDate();
		const appealEntity: InfractionAppealEntity = {
			_id: randomUUID(),
			...data,
			createdAt: now,
		};

		await this.collection.insertOne(appealEntity);
		return appealEntity;
	}

	public async findById(_id: string): Promise<InfractionAppealEntity | null> {
		return await this.collection.findOne({ _id });
	}

	public async findOne(
		filter: Partial<InfractionAppealEntity>
	): Promise<InfractionAppealEntity | null> {
		return await this.collection.findOne(filter);
	}

	public async findMany(
		filter?: Partial<InfractionAppealEntity>
	): Promise<InfractionAppealEntity[]> {
		return await this.collection.find(filter || {}).toArray();
	}

	public async update(
		_id: string,
		data: UpdateInfractionAppealEntity
	): Promise<InfractionAppealEntity | null> {
		const updateData = {
			...data,
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

