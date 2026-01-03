import { randomUUID } from "node:crypto";
import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
	CreatePollVoteEntity,
	PollVoteEntity,
	UpdatePollVoteEntity,
} from "../entity/pollVote.entity";
import type { IRepository } from "../interfaces/IRepository";
import { getDate } from "@/v1/utils/utils";

export class PollVoteRepository
	implements
		IRepository<PollVoteEntity, CreatePollVoteEntity, UpdatePollVoteEntity>
{
	private collection: Collection<PollVoteEntity>;

	constructor(mongoClient: MongoClient) {
		const database = mongoClient.db(env.databases.mongodb.database);
		this.collection = database.collection<PollVoteEntity>(
			env.databases.mongodb.collections.pollVotes,
		);
	}

	public async create(data: CreatePollVoteEntity): Promise<PollVoteEntity> {
		const now = getDate();
		const pollVoteEntity: PollVoteEntity = {
			_id: randomUUID(),
			pollId: data.pollId,
			optionId: data.optionId,
			residentId: data.residentId,
			createdAt: now,
			updatedAt: now,
		};

		await this.collection.insertOne(pollVoteEntity);
		return pollVoteEntity;
	}

	public async findById(_id: string): Promise<PollVoteEntity | null> {
		return await this.collection.findOne({ _id });
	}

	public async findOne(
		filter: Partial<PollVoteEntity>,
	): Promise<PollVoteEntity | null> {
		return await this.collection.findOne(filter);
	}

	public async findMany(
		filter?: Partial<PollVoteEntity>,
	): Promise<PollVoteEntity[]> {
		return await this.collection.find(filter || {}).toArray();
	}

	public async update(
		_id: string,
		data: UpdatePollVoteEntity,
	): Promise<PollVoteEntity | null> {
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

	public async findByPollIdAndResidentId(
		pollId: string,
		residentId: string,
	): Promise<PollVoteEntity | null> {
		return await this.collection.findOne({
			pollId,
			residentId,
		});
	}

	public async countDistinctResidentsByPollIds(
		pollIds: string[],
	): Promise<number> {
		if (pollIds.length === 0) {
			return 0;
		}
		const distinctResidents = await this.collection.distinct("residentId", {
			pollId: { $in: pollIds },
		});
		return distinctResidents.length;
	}

	public async getDistinctResidentIdsByPollIds(
		pollIds: string[],
	): Promise<string[]> {
		if (pollIds.length === 0) {
			return [];
		}
		// Use aggregate instead of distinct for API Version 1 compatibility
		const result = await this.collection
			.aggregate([
				{
					$match: {
						pollId: { $in: pollIds },
					},
				},
				{
					$group: {
						_id: "$residentId",
					},
				},
				{
					$project: {
						_id: 0,
						residentId: "$_id",
					},
				},
			])
			.toArray();
		return result.map((item) => item.residentId);
	}
}

