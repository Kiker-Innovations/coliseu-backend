import { randomUUID } from "node:crypto";
import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
	CreateInfractionEntity,
	InfractionEntity,
	UpdateInfractionEntity,
} from "../entity/infraction.entity";
import type { IRepository } from "../interfaces/IRepository";
import { getDate } from "@/v1/utils/utils";

export class InfractionRepository
	implements
		IRepository<InfractionEntity, CreateInfractionEntity, UpdateInfractionEntity>
{
	private collection: Collection<InfractionEntity>;

	constructor(mongoClient: MongoClient) {
		const database = mongoClient.db(env.databases.mongodb.database);
		this.collection = database.collection<InfractionEntity>(
			env.databases.mongodb.collections.infractions
		);
	}

	public async create(data: CreateInfractionEntity): Promise<InfractionEntity> {
		const now = getDate();
		const infractionEntity: InfractionEntity = {
			_id: randomUUID(),
			...data,
			createdAt: now,
			updatedAt: now,
		};

		await this.collection.insertOne(infractionEntity);
		return infractionEntity;
	}

	public async findById(_id: string): Promise<InfractionEntity | null> {
		return await this.collection.findOne({ _id });
	}

	public async findOne(
		filter: Partial<InfractionEntity>
	): Promise<InfractionEntity | null> {
		return await this.collection.findOne(filter);
	}

	public async findMany(
		filter?: Partial<InfractionEntity>
	): Promise<InfractionEntity[]> {
		return await this.collection.find(filter || {}).toArray();
	}

	public async findManySortedByDate(
		filter?: Partial<InfractionEntity>,
		sortOrder: 1 | -1 = -1
	): Promise<InfractionEntity[]> {
		return await this.collection
			.find(filter || {})
			.sort({ createdAt: sortOrder })
			.toArray();
	}

	public async findManySortedByDateWithFine(
		filter?: Partial<InfractionEntity>,
		sortOrder: 1 | -1 = -1
	): Promise<Array<InfractionEntity & {
		fineName?: string;
		fineDescription?: string;
	}>> {
		const matchFilter = filter || {};

		const pipeline: any[] = [
			{ $match: matchFilter },
			{
				$lookup: {
					from: env.databases.mongodb.collections.fines,
					localField: "fineId",
					foreignField: "_id",
					as: "fine",
				},
			},
			{
				$project: {
					_id: 1,
					apartmentId: 1,
					fineId: 1,
					type: 1,
					description: 1,
					value: 1,
					occurrenceDate: 1,
					canceledNote: 1,
					status: 1,
					createdAt: 1,
					contextedAt: 1,
					confirmedAt: 1,
					paidAt: 1,
					canceledAt: 1,
					updatedAt: 1,
					fineName: { $arrayElemAt: ["$fine.name", 0] },
					fineDescription: { $arrayElemAt: ["$fine.description", 0] },
				},
			},
			{
				$sort: { createdAt: sortOrder },
			},
		];

		const results = await this.collection.aggregate(pipeline).toArray();

		return results.map((r: any) => ({
			_id: String(r._id),
			apartmentId: String(r.apartmentId),
			fineId: String(r.fineId),
			type: String(r.type),
			description: String(r.description || ""),
			value: Number(r.value || 0),
			occurrenceDate: r.occurrenceDate instanceof Date ? r.occurrenceDate : new Date(r.occurrenceDate),
			canceledNote: r.canceledNote ? String(r.canceledNote) : undefined,
			status: String(r.status),
			createdAt: r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt),
			contextedAt: r.contextedAt ? (r.contextedAt instanceof Date ? r.contextedAt : new Date(r.contextedAt)) : undefined,
			confirmedAt: r.confirmedAt ? (r.confirmedAt instanceof Date ? r.confirmedAt : new Date(r.confirmedAt)) : undefined,
			paidAt: r.paidAt ? (r.paidAt instanceof Date ? r.paidAt : new Date(r.paidAt)) : undefined,
			canceledAt: r.canceledAt ? (r.canceledAt instanceof Date ? r.canceledAt : new Date(r.canceledAt)) : undefined,
			updatedAt: r.updatedAt instanceof Date ? r.updatedAt : new Date(r.updatedAt),
			fineName: r.fineName ? String(r.fineName) : undefined,
			fineDescription: r.fineDescription ? String(r.fineDescription) : undefined,
		})) as Array<InfractionEntity & {
			fineName?: string;
			fineDescription?: string;
		}>;
	}

	public async findManyWithResidents(
		filter?: Partial<InfractionEntity>
	): Promise<Array<InfractionEntity & {
		residents: Array<{
			_id: string;
			name: string;
			email: string;
			phone?: string;
		}>;
	}>> {
		const matchFilter = filter || {};

		const pipeline: any[] = [
			{ $match: matchFilter },
			{
				$lookup: {
					from: env.databases.mongodb.collections.residents,
					localField: "apartmentId",
					foreignField: "apartmentId",
					as: "residents",
				},
			},
			{
				$project: {
					_id: 1,
					apartmentId: 1,
					fineId: 1,
					type: 1,
					description: 1,
					value: 1,
					occurrenceDate: 1,
					canceledNote: 1,
					status: 1,
					createdAt: 1,
					confirmedAt: 1,
					paidAt: 1,
					canceledAt: 1,
					updatedAt: 1,
					residents: {
						$map: {
							input: "$residents",
							as: "resident",
							in: {
								_id: "$$resident._id",
								name: "$$resident.name",
								email: "$$resident.email",
								phone: "$$resident.phone",
							},
						},
					},
				},
			},
		];

		const results = await this.collection.aggregate(pipeline).toArray();

		return results.map((r: any) => ({
			_id: String(r._id),
			apartmentId: String(r.apartmentId),
			fineId: String(r.fineId),
			type: String(r.type),
			description: String(r.description || ""),
			value: Number(r.value || 0),
			occurrenceDate: r.occurrenceDate instanceof Date ? r.occurrenceDate : new Date(r.occurrenceDate),
			canceledNote: r.canceledNote ? String(r.canceledNote) : undefined,
			status: String(r.status),
			createdAt: r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt),
			confirmedAt: r.confirmedAt ? (r.confirmedAt instanceof Date ? r.confirmedAt : new Date(r.confirmedAt)) : undefined,
			paidAt: r.paidAt ? (r.paidAt instanceof Date ? r.paidAt : new Date(r.paidAt)) : undefined,
			canceledAt: r.canceledAt ? (r.canceledAt instanceof Date ? r.canceledAt : new Date(r.canceledAt)) : undefined,
			updatedAt: r.updatedAt instanceof Date ? r.updatedAt : new Date(r.updatedAt),
			residents: (r.residents || []).map((resident: any) => ({
				_id: String(resident._id),
				name: String(resident.name || ""),
				email: String(resident.email || ""),
				phone: resident.phone ? String(resident.phone) : undefined,
			})),
		}));
	}

	public async update(
		_id: string,
		data: UpdateInfractionEntity
	): Promise<InfractionEntity | null> {
		const updateData = {
			...data,
			updatedAt: getDate(),
		};

		const result = await this.collection.findOneAndUpdate(
			{ _id },
			{ $set: updateData },
			{ returnDocument: "after" }
		);

		return result || null;
	}

	public async delete(_id: string): Promise<boolean> {
		const result = await this.collection.deleteOne({ _id });
		return result.deletedCount > 0;
	}
}
