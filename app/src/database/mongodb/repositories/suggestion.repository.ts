import { randomUUID } from "node:crypto";
import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
	CreateSuggestionEntity,
	SuggestionEntity,
	UpdateSuggestionEntity,
} from "../entity/suggestion.entity";
import type { IRepository } from "../interfaces/IRepository";
import { getDate } from "@/v1/utils/utils";

export class SuggestionRepository
	implements
		IRepository<
			SuggestionEntity,
			CreateSuggestionEntity,
			UpdateSuggestionEntity
		>
{
	private collection: Collection<SuggestionEntity>;

	constructor(mongoClient: MongoClient) {
		const database = mongoClient.db(env.databases.mongodb.database);
		this.collection = database.collection<SuggestionEntity>(
			env.databases.mongodb.collections.suggestions,
		);
	}

	public async create(data: CreateSuggestionEntity): Promise<SuggestionEntity> {
		const now = getDate();
		const suggestionEntity: SuggestionEntity = {
			_id: randomUUID(),
			...data,
			createdAt: now,
			updatedAt: now,
		};

		await this.collection.insertOne(suggestionEntity);
		return suggestionEntity;
	}

	public async findById(_id: string): Promise<SuggestionEntity | null> {
		return await this.collection.findOne({ _id });
	}

	public async findOne(
		filter: Partial<SuggestionEntity>,
	): Promise<SuggestionEntity | null> {
		return await this.collection.findOne(filter);
	}

	public async findMany(
		filter?: Partial<SuggestionEntity>,
	): Promise<SuggestionEntity[]> {
		return await this.collection.find(filter || {}).toArray();
	}

	public async findManyByResidentId(
		residentId: string,
	): Promise<SuggestionEntity[]> {
		return await this.collection.find({ residentId }).toArray();
	}

	public async update(
		_id: string,
		data: UpdateSuggestionEntity,
	): Promise<SuggestionEntity | null> {
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

