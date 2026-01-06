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
import { getDate, toDate } from "@/v1/utils/utils";
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

		// Convert array of strings to array of PollOption objects with unique IDs
		const options: PollOption[] = data.options.map((description, index) => ({
			id: index,
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
		const poll = await this.collection.findOne({ _id });
		if (!poll) return null;

		// Normalize dates to ensure they are Date objects
		// Handle MongoDB date format { $date: "..." } or direct Date objects
		const normalizeDate = (date: any): Date => {
			if (!date) return date;
			if (date instanceof Date) return date;
			if (typeof date === "object" && "$date" in date) {
				return new Date(date.$date);
			}
			return new Date(date);
		};

		return {
			...poll,
			startDate: normalizeDate(poll.startDate),
			endDate: normalizeDate(poll.endDate),
			createdAt: normalizeDate(poll.createdAt),
			updatedAt: normalizeDate(poll.updatedAt),
			...(poll.cancelledAt && {
				cancelledAt: normalizeDate(poll.cancelledAt),
			}),
		};
	}

	public async findOne(
		filter: Partial<PollEntity>,
	): Promise<PollEntity | null> {
		return await this.collection.findOne(filter);
	}

	public async findMany(filter?: Partial<PollEntity>): Promise<PollEntity[]> {
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

	public async findByStatus(
		buildingId: string,
		status: string[],
	): Promise<PollEntity[]> {
		const query: any = {
			buildingId,
			status: { $in: status },
		};

		const polls = await this.collection
			.find(query)
			.sort({ startDate: -1 })
			.toArray();

		// Normalize dates to ensure they are Date objects
		// Handle MongoDB date format { $date: "..." } or direct Date objects
		return polls.map((poll) => {
			const normalizeDate = (date: any): Date => {
				if (!date) return date;
				if (date instanceof Date) return date;
				if (typeof date === "object" && "$date" in date) {
					return new Date(date.$date);
				}
				return new Date(date);
			};

			return {
				...poll,
				startDate: normalizeDate(poll.startDate),
				endDate: normalizeDate(poll.endDate),
				createdAt: normalizeDate(poll.createdAt),
				updatedAt: normalizeDate(poll.updatedAt),
				...(poll.cancelledAt && {
					cancelledAt: normalizeDate(poll.cancelledAt),
				}),
			};
		});
	}

	// Keep old method for backward compatibility (can be removed later)
	public async findByStatusAndMonthYear(
		buildingId: string,
		status: string[],
		month: number,
		year: number,
	): Promise<PollEntity[]> {
		// Just call the new method without date filtering
		return this.findByStatus(buildingId, status);
	}

	// Keep old methods for backward compatibility (can be removed later)
	public async findActiveByMonthYear(
		buildingId: string,
		month: number,
		year: number,
	): Promise<PollEntity[]> {
		return this.findByStatusAndMonthYear(
			buildingId,
			[PollStatusEnum.ATIVO, PollStatusEnum.PROGRAMADO],
			month,
			year,
		);
	}

	public async findFinishedAndCancelledByMonthYear(
		buildingId: string,
		month: number,
		year: number,
	): Promise<PollEntity[]> {
		return this.findByStatusAndMonthYear(
			buildingId,
			[PollStatusEnum.FINALIZADO, PollStatusEnum.CANCELADO],
			month,
			year,
		);
	}

	public async incrementOptionVote(
		_id: string,
		optionId: number,
	): Promise<PollEntity | null> {
		const result = await this.collection.findOneAndUpdate(
			{ _id },
			{
				$inc: {
					"options.$[option].votes": 1,
					votes: 1,
				},
				$set: {
					updatedAt: getDate(),
				},
			},
			{
				arrayFilters: [{ "option.id": optionId }],
				returnDocument: "after",
			},
		);

		return result || null;
	}

	public async decrementOptionVote(
		_id: string,
		optionId: number,
	): Promise<PollEntity | null> {
		const result = await this.collection.findOneAndUpdate(
			{ _id },
			{
				$inc: {
					"options.$[option].votes": -1,
					votes: -1,
				},
				$set: {
					updatedAt: getDate(),
				},
			},
			{
				arrayFilters: [{ "option.id": optionId }],
				returnDocument: "after",
			},
		);

		return result || null;
	}

	public async updateOptionVote(
		_id: string,
		oldOptionId: number,
		newOptionId: number,
	): Promise<PollEntity | null> {
		// Decrement old option and increment new option in a single operation
		// Note: total votes count doesn't change, only the distribution
		const result = await this.collection.findOneAndUpdate(
			{ _id },
			{
				$inc: {
					"options.$[oldOption].votes": -1,
					"options.$[newOption].votes": 1,
				},
				$set: {
					updatedAt: getDate(),
				},
			},
			{
				arrayFilters: [
					{ "oldOption.id": oldOptionId },
					{ "newOption.id": newOptionId },
				],
				returnDocument: "after",
			},
		);

		return result || null;
	}
}
