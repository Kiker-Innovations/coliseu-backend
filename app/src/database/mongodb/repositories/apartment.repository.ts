import { randomUUID } from "node:crypto";
import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
	CreateApartmentEntity,
	ApartmentEntity,
	UpdateApartmentEntity,
} from "../entity/apartment.entity";
import type { IRepository } from "../interfaces/IRepository";
import { getDate } from "@/v1/utils/utils";

export class ApartmentRepository
	implements
		IRepository<ApartmentEntity, CreateApartmentEntity, UpdateApartmentEntity>
{
	private collection: Collection<ApartmentEntity>;

	constructor(mongoClient: MongoClient) {
		const database = mongoClient.db(env.databases.mongodb.database);
		this.collection = database.collection<ApartmentEntity>(
			env.databases.mongodb.collections.apartments,
		);
	}

	public async create(data: CreateApartmentEntity): Promise<ApartmentEntity> {
		const now = getDate();
		const apartmentEntity: ApartmentEntity = {
			_id: randomUUID(),
			...data,
			createdAt: now,
			updatedAt: now,
		};

		await this.collection.insertOne(apartmentEntity);
		return apartmentEntity;
	}

	public async findById(_id: string): Promise<ApartmentEntity | null> {
		return await this.collection.findOne({ _id });
	}

	public async findOne(
		filter: Partial<ApartmentEntity>,
	): Promise<ApartmentEntity | null> {
		return await this.collection.findOne(filter);
	}

	public async findMany(
		filter?: Partial<ApartmentEntity>,
	): Promise<ApartmentEntity[]> {
		return await this.collection.find(filter || {}).toArray();
	}

	public async update(
		_id: string,
		data: UpdateApartmentEntity,
	): Promise<ApartmentEntity | null> {
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
}

