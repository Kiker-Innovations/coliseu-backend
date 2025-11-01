import { randomUUID } from "node:crypto";
import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
	CreateAdminEntity,
	AdminEntity,
	UpdateAdminEntity,
} from "../entity/admin.entity";
import type { IRepository } from "../interfaces/IRepository";

export class AdminRepository
	implements IRepository<AdminEntity, CreateAdminEntity, UpdateAdminEntity>
{
	private collection: Collection<AdminEntity>;

	constructor(mongoClient: MongoClient) {
		const database = mongoClient.db(env.databases.mongodb.database);
		this.collection = database.collection<AdminEntity>(
			env.databases.mongodb.collections.admins,
		);
	}

	public async create(data: CreateAdminEntity): Promise<AdminEntity> {
		const now = new Date();
		const adminEntity: AdminEntity = {
			_id: randomUUID(),
			...data,
			createdAt: now,
			updatedAt: now,
		};

		await this.collection.insertOne(adminEntity);
		return adminEntity;
	}

	public async findById(_id: string): Promise<AdminEntity | null> {
		return await this.collection.findOne({ _id });
	}

	public async findOne(
		filter: Partial<AdminEntity>,
	): Promise<AdminEntity | null> {
		return await this.collection.findOne(filter);
	}

	public async findMany(filter?: Partial<AdminEntity>): Promise<AdminEntity[]> {
		return await this.collection.find(filter || {}).toArray();
	}

	public async update(
		_id: string,
		data: UpdateAdminEntity,
	): Promise<AdminEntity | null> {
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

	public async findByEmail(email: string): Promise<AdminEntity | null> {
		return await this.findOne({ email });
	}
}

