import { randomUUID } from "node:crypto";
import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
	CreateVisitorEntity,
	VisitorEntity,
	UpdateVisitorEntity,
} from "../entity/visitor.entity";
import type { IRepository } from "../interfaces/IRepository";
import { getDate } from "@/v1/utils/utils";

export interface VisitorListFilters {
	buildingId: string;
	search?: string;
	filterBy?: "name" | "document" | "apartment";
	page?: number;
	limit?: number;
}

export interface VisitorListItem {
	_id: string;
	name: string;
	phone?: string;
	vehicleType?: string;
	vehiclePlate?: string;
	types: string[];
	photoUrl: string;
	note?: string;
	active: boolean;
	apartmentNumber?: string;
}

export interface VisitorListResult {
	data: VisitorListItem[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export class VisitorRepository
	implements
		IRepository<VisitorEntity, CreateVisitorEntity, UpdateVisitorEntity>
{
	private collection: Collection<VisitorEntity>;

	constructor(mongoClient: MongoClient) {
		const database = mongoClient.db(env.databases.mongodb.database);
		this.collection = database.collection<VisitorEntity>(
			env.databases.mongodb.collections.visitors,
		);
	}

	public async create(data: CreateVisitorEntity): Promise<VisitorEntity> {
		const now = getDate();
		const visitorEntity: VisitorEntity = {
			_id: randomUUID(),
			...data,
			createdAt: now,
			updatedAt: now,
		};

		await this.collection.insertOne(visitorEntity);
		return visitorEntity;
	}

	public async findById(_id: string): Promise<VisitorEntity | null> {
		return await this.collection.findOne({
			_id,
			deletedAt: { $exists: false },
		});
	}

	public async findOne(
		filter: Partial<VisitorEntity>,
	): Promise<VisitorEntity | null> {
		return await this.collection.findOne({
			...filter,
			deletedAt: { $exists: false },
		});
	}

	public async findMany(
		filter?: Partial<VisitorEntity>,
	): Promise<VisitorEntity[]> {
		return await this.collection
			.find({
				...filter,
				deletedAt: { $exists: false },
			})
			.toArray();
	}

	public async update(
		_id: string,
		data: UpdateVisitorEntity,
	): Promise<VisitorEntity | null> {
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
		// Soft delete
		const result = await this.collection.findOneAndUpdate(
			{ _id },
			{ $set: { deletedAt: getDate(), updatedAt: getDate() } },
		);
		return result !== null;
	}

	public async findByDocument(
		document: string,
		buildingId: string,
	): Promise<VisitorEntity | null> {
		return await this.collection.findOne({
			document,
			buildingId,
			deletedAt: { $exists: false },
		});
	}

	public async listWithFilters(
		filters: VisitorListFilters,
	): Promise<VisitorListResult> {
		const page = filters.page || 1;
		const limit = filters.limit || 10;
		const skip = (page - 1) * limit;

		// Build match filter
		const matchFilter: any = {
			buildingId: filters.buildingId,
			deletedAt: { $exists: false },
		};

		// Apply search filter
		if (filters.search && filters.filterBy) {
			switch (filters.filterBy) {
				case "name":
					matchFilter.name = { $regex: filters.search, $options: "i" };
					break;
				case "document":
					matchFilter.document = { $regex: filters.search, $options: "i" };
					break;
				case "apartment":
					// Will be handled in aggregation with lookup
					break;
			}
		}

		// Build aggregation pipeline
		const pipeline: any[] = [{ $match: matchFilter }];

		// Always lookup visits to get apartment information
		pipeline.push({
			$lookup: {
				from: env.databases.mongodb.collections.visits,
				localField: "_id",
				foreignField: "visitorId",
				as: "visits",
			},
		});

		// Lookup apartments from visits
		pipeline.push({
			$lookup: {
				from: env.databases.mongodb.collections.apartments,
				localField: "visits.apartmentId",
				foreignField: "_id",
				as: "apartments",
			},
		});

		// Add apartment number filter if needed - search through visits
		if (filters.filterBy === "apartment" && filters.search) {
			// Filter by apartment number
			pipeline.push({
				$match: {
					"apartments.number": filters.search,
					"apartments.buildingId": filters.buildingId,
				},
			});
		}

		// Count total before pagination
		const countPipeline = [...pipeline, { $count: "total" }];
		const countResult = await this.collection
			.aggregate(countPipeline)
			.toArray();
		const total = countResult[0]?.total || 0;

		// Add sort before projection (to use createdAt)
		pipeline.push({ $sort: { createdAt: -1 } });

		// Add projection, skip, and limit
		// Get the apartment number from the first apartment in visits
		pipeline.push(
			{
				$project: {
					_id: 1,
					name: 1,
					phone: 1,
					vehicleType: 1,
					vehiclePlate: 1,
					types: 1,
					photoUrl: 1,
					note: 1,
					active: 1,
					apartmentNumber: { $arrayElemAt: ["$apartments.number", 0] },
				},
			},
			{ $skip: skip },
			{ $limit: limit },
		);

		// Execute aggregation
		const data = (await this.collection
			.aggregate(pipeline)
			.toArray()) as VisitorListItem[];

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
		limit: number,
	): Promise<VisitorListItem[]> {
		const pipeline: any[] = [
			{
				$match: {
					buildingId,
					deletedAt: { $exists: false },
				},
			},
			{ $sort: { createdAt: -1 } },
			{
				$project: {
					_id: 1,
					name: 1,
					phone: 1,
					vehicleType: 1,
					vehiclePlate: 1,
					types: 1,
					photoUrl: 1,
					note: 1,
					active: 1,
				},
			},
			{ $limit: limit },
		];

		return (await this.collection
			.aggregate(pipeline)
			.toArray()) as VisitorListItem[];
	}
}

