import { randomUUID } from "node:crypto";
import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
	CreatePollEntity,
	PollEntity,
	PollOption,
	UpdatePollEntity,
} from "../entity/poll.entity";
import type { IRepository } from "../interfaces/IRepository";
import { getDate } from "@/v1/utils/utils";
import { PollStatusEnum } from "@/v1/enum/pollStatus.enum";

export class PollRepository
	implements IRepository<PollEntity, CreatePollEntity, UpdatePollEntity>
{
	private collection: Collection<PollEntity>;

	constructor(mongoClient: MongoClient) {
		const database = mongoClient.db(env.databases.mongodb.database);
		this.collection = database.collection<PollEntity>(
			env.databases.mongodb.collections.polls,
		);
	}

	public async create(data: CreatePollEntity): Promise<PollEntity> {
		const now = getDate();
		
		// Convert array of strings to array of PollOption objects
		const options: PollOption[] = data.options.map((description) => ({
			description,
			votes: 0,
			percent: 0,
		}));

		const pollEntity: PollEntity = {
			_id: randomUUID(),
			buildingId: data.buildingId,
			description: data.description,
			options,
			votes: 0,
			status: data.status,
			startDate: data.startDate,
			endDate: data.endDate,
			createdAt: now,
			updatedAt: now,
		};

		await this.collection.insertOne(pollEntity);
		return pollEntity;
	}

	public async findById(_id: string): Promise<PollEntity | null> {
		return await this.collection.findOne({ _id });
	}

	public async findOne(
		filter: Partial<PollEntity>,
	): Promise<PollEntity | null> {
		return await this.collection.findOne(filter);
	}

	public async findMany(
		filter?: Partial<PollEntity>,
	): Promise<PollEntity[]> {
		return await this.collection.find(filter || {}).toArray();
	}

	public async update(
		_id: string,
		data: UpdatePollEntity,
	): Promise<PollEntity | null> {
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

	public async findActiveByMonthYear(
		buildingId: string,
		month: number,
		year: number,
	): Promise<PollEntity[]> {
		const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
		const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

		return await this.collection
			.find({
				buildingId,
				status: PollStatusEnum.ATIVO,
				startDate: {
					$gte: startOfMonth,
					$lte: endOfMonth,
				},
			})
			.toArray();
	}

	public async findFinishedAndCancelledByMonthYear(
		buildingId: string,
		month: number,
		year: number,
	): Promise<PollEntity[]> {
		const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
		const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

		return await this.collection
			.find({
				buildingId,
				status: {
					$in: [PollStatusEnum.FINALIZADO, PollStatusEnum.CANCELADO],
				},
				$or: [
					{ endDate: { $gte: startOfMonth, $lte: endOfMonth } },
					{ cancelledAt: { $gte: startOfMonth, $lte: endOfMonth } },
				],
			})
			.toArray();
	}
}

