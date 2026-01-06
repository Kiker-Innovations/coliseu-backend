import { randomUUID } from "node:crypto";
import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
	CreateVisitEntity,
	VisitEntity,
	UpdateVisitEntity,
} from "../entity/visit.entity";
import type { IRepository } from "../interfaces/IRepository";
import { getDate } from "@/v1/utils/utils";

export interface VisitListFilters {
	visitorId: string;
	buildingId: string;
	page?: number;
	limit?: number;
}

export interface VisitListItem {
	_id: string;
	visitorId: string;
	apartmentId?: string;
	note?: string;
	registeredBy: string;
	registeredAt: Date;
	buildingId: string;
	createdAt: Date;
	updatedAt: Date;
	apartmentNumber?: string;
	apartmentFloor?: number;
	apartmentBlock?: string;
}

export interface RecentVisitItem {
	_id: string;
	visitorId: string;
	apartmentId?: string;
	note?: string;
	registeredBy: string;
	registeredAt: Date;
	buildingId: string;
	createdAt: Date;
	updatedAt: Date;
	visitor: {
		_id: string;
		name: string;
		email?: string;
		phone?: string;
		photoUrl: string;
	};
	apartment?: {
		_id: string;
		number: string;
		floor: number;
		block: string;
	};
}

export interface VisitListResult {
	data: VisitListItem[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export class VisitRepository
	implements IRepository<VisitEntity, CreateVisitEntity, UpdateVisitEntity>
{
	private collection: Collection<VisitEntity>;

	constructor(mongoClient: MongoClient) {
		const database = mongoClient.db(env.databases.mongodb.database);
		this.collection = database.collection<VisitEntity>(
			env.databases.mongodb.collections.visits,
		);
	}

	public async create(data: CreateVisitEntity): Promise<VisitEntity> {
		const now = getDate();
		const visitEntity: VisitEntity = {
			_id: randomUUID(),
			...data,
			createdAt: now,
			updatedAt: now,
		};

		await this.collection.insertOne(visitEntity);
		return visitEntity;
	}

	public async findById(_id: string): Promise<VisitEntity | null> {
		return await this.collection.findOne({
			_id,
			deletedAt: { $exists: false },
		});
	}

	public async findOne(
		filter: Partial<VisitEntity>,
	): Promise<VisitEntity | null> {
		return await this.collection.findOne({
			...filter,
			deletedAt: { $exists: false },
		});
	}

	public async findMany(filter?: Partial<VisitEntity>): Promise<VisitEntity[]> {
		const query = {
			...(filter || {}),
			deletedAt: { $exists: false },
		};
		return await this.collection.find(query).toArray();
	}

	public async update(
		_id: string,
		data: UpdateVisitEntity,
	): Promise<VisitEntity | null> {
		const updateData = {
			...data,
			updatedAt: getDate(),
		};

		const result = await this.collection.findOneAndUpdate(
			{ _id, deletedAt: { $exists: false } },
			{ $set: updateData },
			{ returnDocument: "after" },
		);

		return result || null;
	}

	public async delete(_id: string): Promise<boolean> {
		const now = getDate();
		const result = await this.collection.findOneAndUpdate(
			{ _id },
			{ $set: { deletedAt: now, updatedAt: now } },
		);
		return result !== null;
	}

	public async listByVisitorId(
		filters: VisitListFilters,
	): Promise<VisitListResult> {
		const page = filters.page || 1;
		const limit = filters.limit || 10;
		const skip = (page - 1) * limit;

		// Build aggregation pipeline
		const pipeline: any[] = [
			{
				$match: {
					visitorId: filters.visitorId,
					buildingId: filters.buildingId,
					deletedAt: { $exists: false },
				},
			},
			{
				$lookup: {
					from: env.databases.mongodb.collections.apartments,
					localField: "apartmentId",
					foreignField: "_id",
					as: "apartment",
				},
			},
			{
				$unwind: {
					path: "$apartment",
					preserveNullAndEmptyArrays: true,
				},
			},
		];

		// Count total before pagination
		const countPipeline = [...pipeline, { $count: "total" }];
		const countResult = await this.collection
			.aggregate(countPipeline)
			.toArray();
		const total = countResult[0]?.total || 0;

		// Add sort before projection
		pipeline.push({ $sort: { createdAt: -1 } });

		// Add projection, skip, and limit
		pipeline.push(
			{
				$project: {
					_id: 1,
					visitorId: 1,
					apartmentId: 1,
					note: 1,
					registeredBy: 1,
					registeredAt: 1,
					buildingId: 1,
					createdAt: 1,
					updatedAt: 1,
					apartmentNumber: "$apartment.number",
					apartmentFloor: "$apartment.floor",
					apartmentBlock: "$apartment.block",
				},
			},
			{ $skip: skip },
			{ $limit: limit },
		);

		// Execute aggregation
		const data = (await this.collection
			.aggregate(pipeline)
			.toArray()) as VisitListItem[];

		const totalPages = Math.ceil(total / limit);

		return {
			data,
			total,
			page,
			limit,
			totalPages,
		};
	}

	public async findRecent(
		buildingId: string,
		limit: number = 10,
	): Promise<RecentVisitItem[]> {
		const pipeline: any[] = [
			{
				$match: {
					buildingId,
					deletedAt: { $exists: false },
				},
			},
			{
				$lookup: {
					from: env.databases.mongodb.collections.visitors,
					localField: "visitorId",
					foreignField: "_id",
					as: "visitor",
				},
			},
			{
				$unwind: {
					path: "$visitor",
					preserveNullAndEmptyArrays: false,
				},
			},
			{
				$match: {
					"visitor.deletedAt": { $exists: false },
				},
			},
			{
				$lookup: {
					from: env.databases.mongodb.collections.apartments,
					localField: "apartmentId",
					foreignField: "_id",
					as: "apartment",
				},
			},
			{
				$unwind: {
					path: "$apartment",
					preserveNullAndEmptyArrays: true,
				},
			},
			{ $sort: { createdAt: -1 } },
			{
				$project: {
					_id: 1,
					visitorId: 1,
					apartmentId: 1,
					note: 1,
					registeredBy: 1,
					registeredAt: 1,
					buildingId: 1,
					createdAt: 1,
					updatedAt: 1,
					visitor: {
						_id: "$visitor._id",
						name: "$visitor.name",
						email: "$visitor.email",
						phone: "$visitor.phone",
						photoUrl: "$visitor.photoUrl",
					},
					apartment: {
						$cond: {
							if: { $ne: ["$apartment._id", null] },
							then: {
								_id: "$apartment._id",
								number: "$apartment.number",
								floor: "$apartment.floor",
								block: "$apartment.block",
							},
							else: null,
						},
					},
				},
			},
			{ $limit: limit },
		];

		return (await this.collection
			.aggregate(pipeline)
			.toArray()) as RecentVisitItem[];
	}
}
