import { randomUUID } from "node:crypto";
import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
	CreateNoticeEntity,
	NoticeEntity,
	UpdateNoticeEntity,
} from "../entity/notice.entity";
import type { IRepository } from "../interfaces/IRepository";
import { getDate } from "@/v1/utils/utils";
import type { NoticeStatusEnumType } from "@/v1/enum/noticeStatus.enum";

export class NoticeRepository
	implements IRepository<NoticeEntity, CreateNoticeEntity, UpdateNoticeEntity>
{
	private collection: Collection<NoticeEntity>;

	constructor(mongoClient: MongoClient) {
		const database = mongoClient.db(env.databases.mongodb.database);
		this.collection = database.collection<NoticeEntity>(
			env.databases.mongodb.collections.notices
		);
	}

	public async create(data: CreateNoticeEntity): Promise<NoticeEntity> {
		const now = getDate();
		const noticeEntity: NoticeEntity = {
			_id: randomUUID(),
			...data,
			createdAt: now,
		};

		await this.collection.insertOne(noticeEntity);
		return noticeEntity;
	}

	public async findById(_id: string): Promise<NoticeEntity | null> {
		return await this.collection.findOne({ _id });
	}

	public async findOne(
		filter: Partial<NoticeEntity>
	): Promise<NoticeEntity | null> {
		return await this.collection.findOne({
			...filter,
			deletedAt: { $exists: false },
		});
	}

	public async findMany(
		filter?: Partial<NoticeEntity>
	): Promise<NoticeEntity[]> {
		const query = {
			...(filter || {}),
			deletedAt: { $exists: false },
		};
		return await this.collection.find(query).toArray();
	}

	public async findManyByBuildingId(
		buildingId: string,
		status?: NoticeStatusEnumType
	): Promise<NoticeEntity[]> {
		const query: any = {
			buildingId,
		};

		if (status) {
			query.status = status;
		}

		return await this.collection
			.find(query)
			.sort({ createdAt: -1 })
			.toArray();
	}

	public async listWithFilters(
		filters: {
			buildingId: string;
			status?: NoticeStatusEnumType;
		},
		page?: number,
		limit?: number
	): Promise<{ notices: NoticeEntity[]; total: number }> {
		const query: any = {
			buildingId: filters.buildingId,
		};

		if (filters.status) {
			query.status = filters.status;
		}

		// Contar total antes da paginação
		const total = await this.collection.countDocuments(query);

		// Aplicar paginação e ordenação
		let cursor = this.collection.find(query).sort({ createdAt: -1 });

		if (page !== undefined && limit !== undefined) {
			const skip = (page - 1) * limit;
			cursor = cursor.skip(skip).limit(limit);
		}

		const notices = await cursor.toArray();

		return { notices, total };
	}

	public async update(
		_id: string,
		data: UpdateNoticeEntity
	): Promise<NoticeEntity | null> {
		const result = await this.collection.findOneAndUpdate(
			{ _id, deletedAt: { $exists: false } },
			{ $set: data },
			{ returnDocument: "after" }
		);

		return result || null;
	}

	public async delete(_id: string, deletedNote?: string): Promise<boolean> {
		const now = getDate();
		const updateData: any = { deletedAt: now };
		if (deletedNote) {
			updateData.deletedNote = deletedNote;
			updateData.status = "INATIVO";
		}
		const result = await this.collection.findOneAndUpdate(
			{ _id },
			{ $set: updateData },
			{ returnDocument: "after" }
		);

		return result !== null;
	}
}

