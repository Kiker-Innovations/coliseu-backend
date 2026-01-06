import { randomUUID } from "node:crypto";
import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
	CreateResidentSuggestionEntity,
	ResidentSuggestionEntity,
	UpdateResidentSuggestionEntity,
} from "../entity/residentSuggestion.entity";
import type { IRepository } from "../interfaces/IRepository";
import { getDate } from "@/v1/utils/utils";

export class ResidentSuggestionRepository
	implements
		IRepository<
			ResidentSuggestionEntity,
			CreateResidentSuggestionEntity,
			UpdateResidentSuggestionEntity
		>
{
	private collection: Collection<ResidentSuggestionEntity>;

	constructor(mongoClient: MongoClient) {
		const database = mongoClient.db(env.databases.mongodb.database);
		this.collection = database.collection<ResidentSuggestionEntity>(
			env.databases.mongodb.collections.residentSuggestions,
		);
	}

	public async create(
		data: CreateResidentSuggestionEntity,
	): Promise<ResidentSuggestionEntity> {
		const now = getDate();
		const residentSuggestionEntity: ResidentSuggestionEntity = {
			_id: randomUUID(),
			...data,
			createdAt: now,
			updatedAt: now,
		};

		await this.collection.insertOne(residentSuggestionEntity);
		return residentSuggestionEntity;
	}

	public async findById(_id: string): Promise<ResidentSuggestionEntity | null> {
		return await this.collection.findOne({ _id });
	}

	public async findOne(
		filter: Partial<ResidentSuggestionEntity>,
	): Promise<ResidentSuggestionEntity | null> {
		return await this.collection.findOne(filter);
	}

	public async findMany(
		filter?: Partial<ResidentSuggestionEntity>,
	): Promise<ResidentSuggestionEntity[]> {
		return await this.collection.find(filter || {}).toArray();
	}

	public async findManyByApartmentIdAndSeason(
		apartmentId: string,
		actualSeasonId: string,
	): Promise<ResidentSuggestionEntity[]> {
		return await this.collection
			.find({ apartmentId, actualSeasonId })
			.toArray();
	}

	public async countByApartmentId(apartmentId: string): Promise<number> {
		return await this.collection.countDocuments({ apartmentId });
	}

	public async update(
		_id: string,
		data: UpdateResidentSuggestionEntity,
	): Promise<ResidentSuggestionEntity | null> {
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
