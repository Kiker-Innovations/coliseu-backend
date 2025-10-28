import { randomUUID } from "node:crypto";
import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
	CreateResidentEntity,
	ResidentEntity,
	UpdateResidentEntity,
} from "../entity/resident.entity";
import type { IRepository } from "../interfaces/IRepository";

export class ResidentRepository
	implements
		IRepository<ResidentEntity, CreateResidentEntity, UpdateResidentEntity>
{
	private collection: Collection<ResidentEntity>;

	constructor(mongoClient: MongoClient) {
		const database = mongoClient.db();
		this.collection = database.collection<ResidentEntity>(
			env.databases.mongodb.collections.residents,
		);
	}

	public async create(data: CreateResidentEntity): Promise<ResidentEntity> {
		const now = new Date();
		const residentEntity: ResidentEntity = {
			id: randomUUID(),
			...data,
			createdAt: now,
			updatedAt: now,
		};

		await this.collection.insertOne(residentEntity);
		return residentEntity;
	}

	public async findById(id: string): Promise<ResidentEntity | null> {
		return await this.collection.findOne({ id });
	}

	public async findOne(
		filter: Partial<ResidentEntity>,
	): Promise<ResidentEntity | null> {
		return await this.collection.findOne(filter);
	}

	public async findMany(
		filter?: Partial<ResidentEntity>,
	): Promise<ResidentEntity[]> {
		return await this.collection.find(filter || {}).toArray();
	}

	public async update(
		id: string,
		data: UpdateResidentEntity,
	): Promise<ResidentEntity | null> {
		const updateData = {
			...data,
			updatedAt: new Date(),
		};

		const result = await this.collection.findOneAndUpdate(
			{ id },
			{ $set: updateData },
			{ returnDocument: "after" },
		);

		return result || null;
	}

	public async delete(id: string): Promise<boolean> {
		const result = await this.collection.deleteOne({ id });
		return result.deletedCount > 0;
	}

	public async findByEmail(email: string): Promise<ResidentEntity | null> {
		return await this.findOne({ email });
	}

	public async updateByEmail(
		email: string,
		data: UpdateResidentEntity,
	): Promise<ResidentEntity | null> {
		const updateData = {
			...data,
			updatedAt: new Date(),
		};

		const result = await this.collection.findOneAndUpdate(
			{ email },
			{ $set: updateData },
			{ returnDocument: "after" },
		);

		return result || null;
	}
}
