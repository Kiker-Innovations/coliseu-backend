import { randomUUID } from "node:crypto";
import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
	CreateBuildingEntity,
	BuildingEntity,
	UpdateBuildingEntity,
} from "../entity/building.entity";
import type { IRepository } from "../interfaces/IRepository";
import { getDate } from "@/v1/utils/utils";

export class BuildingRepository
	implements
		IRepository<BuildingEntity, CreateBuildingEntity, UpdateBuildingEntity>
{
	private collection: Collection<BuildingEntity>;

	constructor(mongoClient: MongoClient) {
		const database = mongoClient.db(env.databases.mongodb.database);
		this.collection = database.collection<BuildingEntity>(
			env.databases.mongodb.collections.buildings,
		);
	}

	public async create(data: CreateBuildingEntity): Promise<BuildingEntity> {
		const now = getDate();
		const buildingEntity: BuildingEntity = {
			_id: randomUUID(),
			...data,
			createdAt: now,
			updatedAt: now,
		};

		await this.collection.insertOne(buildingEntity);
		return buildingEntity;
	}

	public async findById(_id: string): Promise<BuildingEntity | null> {
		return await this.collection.findOne({ _id });
	}

	public async findOne(
		filter: Partial<BuildingEntity>,
	): Promise<BuildingEntity | null> {
		return await this.collection.findOne(filter);
	}

	public async findMany(
		filter?: Partial<BuildingEntity>,
	): Promise<BuildingEntity[]> {
		return await this.collection.find(filter || {}).toArray();
	}

	public async update(
		_id: string,
		data: UpdateBuildingEntity,
	): Promise<BuildingEntity | null> {
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

	public async findByCnpj(cnpj: string): Promise<BuildingEntity | null> {
		return await this.findOne({ cnpj });
	}
}
