import { randomUUID } from "node:crypto";
import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
	CreateAmenityEntity,
	AmenityEntity,
	UpdateAmenityEntity,
} from "../entity/amenity.entity";
import type { IRepository } from "../interfaces/IRepository";
import { getDate } from "@/v1/utils/utils";

export class AmenityRepository
	implements
		IRepository<AmenityEntity, CreateAmenityEntity, UpdateAmenityEntity>
{
	private collection: Collection<AmenityEntity>;

	constructor(mongoClient: MongoClient) {
		const database = mongoClient.db(env.databases.mongodb.database);
		this.collection = database.collection<AmenityEntity>(
			env.databases.mongodb.collections.amenities,
		);
	}

	public async create(data: CreateAmenityEntity): Promise<AmenityEntity> {
		const now = getDate();
		const amenityEntity: AmenityEntity = {
			_id: randomUUID(),
			...data,
			createdAt: now,
			updatedAt: now,
		};

		await this.collection.insertOne(amenityEntity);
		return amenityEntity;
	}

	public async findById(_id: string): Promise<AmenityEntity | null> {
		return await this.collection.findOne({ _id });
	}

	public async findOne(
		filter: Partial<AmenityEntity>,
	): Promise<AmenityEntity | null> {
		return await this.collection.findOne(filter);
	}

	public async findMany(
		filter?: Partial<AmenityEntity>,
	): Promise<AmenityEntity[]> {
		return await this.collection.find(filter || {}).toArray();
	}

	public async update(
		_id: string,
		data: UpdateAmenityEntity,
	): Promise<AmenityEntity | null> {
		// Remover campos undefined para evitar problemas no MongoDB
		const updateData: any = {
			updatedAt: getDate(),
		};
		
		const unsetFields: any = {};

		Object.keys(data).forEach((key) => {
			const value = (data as any)[key];
			// Se value ou fineValue forem null, remover do banco usando $unset
			if (value === null && (key === "value" || key === "fineValue")) {
				unsetFields[key] = "";
			} else if (value !== undefined && value !== null) {
				updateData[key] = value;
			}
		});

		// Se houver campos para remover, usar $unset
		const updateOperation: any = { $set: updateData };
		if (Object.keys(unsetFields).length > 0) {
			updateOperation.$unset = unsetFields;
		}

		const result = await this.collection.findOneAndUpdate(
			{ _id },
			updateOperation,
			{ returnDocument: "after" },
		);

		return result || null;
	}

	public async delete(_id: string): Promise<boolean> {
		const result = await this.collection.deleteOne({ _id });
		return result.deletedCount > 0;
	}

	public async count(filter?: Partial<AmenityEntity>): Promise<number> {
		return await this.collection.countDocuments(filter || {});
	}
}

