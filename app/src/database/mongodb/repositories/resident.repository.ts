import { randomUUID } from "node:crypto";
import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
	CreateResidentEntity,
	ResidentEntity,
	UpdateResidentEntity,
} from "../entity/resident.entity";
import type { IRepository } from "../interfaces/IRepository";
import { getDate } from "@/v1/utils/utils";

export class ResidentRepository
	implements
		IRepository<ResidentEntity, CreateResidentEntity, UpdateResidentEntity>
{
	private collection: Collection<ResidentEntity>;

	constructor(mongoClient: MongoClient) {
		const database = mongoClient.db(env.databases.mongodb.database);
		this.collection = database.collection<ResidentEntity>(
			env.databases.mongodb.collections.residents,
		);
	}

	public async create(data: CreateResidentEntity): Promise<ResidentEntity> {
		const now = getDate();
		const residentEntity: ResidentEntity = {
			_id: randomUUID(),
			...data,
			createdAt: now,
			updatedAt: now,
		};

		await this.collection.insertOne(residentEntity);
		return residentEntity;
	}

	public async findById(_id: string): Promise<ResidentEntity | null> {
		return await this.collection.findOne({ _id });
	}

	public async findOne(
		filter: Partial<ResidentEntity>,
	): Promise<ResidentEntity | null> {
		return await this.collection.findOne(filter);
	}

	public async findMany(
		filter?: Partial<ResidentEntity> | any, // Permitir queries MongoDB complexas
	): Promise<ResidentEntity[]> {
		return await this.collection.find(filter || {}).toArray();
	}

	public async findManyWithPagination(
		filter: any,
		page: number = 1,
		limit: number = 10,
	): Promise<{ residents: ResidentEntity[]; total: number }> {
		const skip = (page - 1) * limit;
		const total = await this.collection.countDocuments(filter);

		const residents = await this.collection
			.find(filter)
			.skip(skip)
			.limit(limit)
			.toArray();

		return { residents: residents as ResidentEntity[], total };
	}

	public async update(
		_id: string,
		data: UpdateResidentEntity,
	): Promise<ResidentEntity | null> {
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

	public async removeRejectionFields(_id: string): Promise<void> {
		await this.collection.updateOne(
			{ _id },
			{
				$unset: {
					rejectType: "",
					rejectNote: "",
				},
			},
		);
	}

	public async removeInactiveFields(_id: string): Promise<void> {
		await this.collection.updateOne(
			{ _id },
			{
				$unset: {
					inactiveType: "",
					inactiveNote: "",
				},
			},
		);
	}

	public async findByEmail(email: string): Promise<ResidentEntity | null> {
		return await this.findOne({ email });
	}

	public async findByDocumentAndBuilding(
		document: string,
		buildingId: string,
	): Promise<ResidentEntity | null> {
		return await this.findOne({ document, buildingId });
	}

	public async findByPhoneAndBuilding(
		phone: string,
		buildingId: string,
	): Promise<ResidentEntity | null> {
		return await this.findOne({ phone, buildingId });
	}

	public async updateByEmail(
		email: string,
		data: UpdateResidentEntity,
	): Promise<ResidentEntity | null> {
		const updateData = {
			...data,
			updatedAt: getDate(),
		};

		const result = await this.collection.findOneAndUpdate(
			{ email },
			{ $set: updateData },
			{ returnDocument: "after" },
		);

		return result || null;
	}

	public async countByBuildingId(buildingId: string): Promise<number> {
		return await this.collection.countDocuments({ buildingId });
	}

	public async countActiveByBuildingId(buildingId: string): Promise<number> {
		return await this.collection.countDocuments({
			buildingId,
			status: "ATIVO",
		});
	}

	public async findManyWithApartments(
		buildingId: string,
		params?: {
			page?: number;
			limit?: number;
			search?: string;
			filterBy?: "name" | "phone" | "email" | "apartment";
			status?: string;
		},
	): Promise<
		Array<{
			_id: string;
			name: string;
			email: string;
			phone?: string;
			apartmentId?: string;
			apartmentNumber?: string;
			status: string;
		}>
	> {
		const filter: any = { buildingId };
		if (params?.status) filter.status = params.status;
		if (params?.search && params?.filterBy) {
			if (params.filterBy === "name")
				filter.name = { $regex: params.search, $options: "i" };
			else if (params.filterBy === "email")
				filter.email = { $regex: params.search, $options: "i" };
			else if (params.filterBy === "phone")
				filter.phone = { $regex: params.search, $options: "i" };
		}

		const pipeline: any[] = [
			{ $match: filter },
			{
				$lookup: {
					from: env.databases.mongodb.collections.apartments,
					localField: "apartmentId",
					foreignField: "_id",
					as: "apartment",
				},
			},
			{ $unwind: "$apartment" },
		];

		if (params?.filterBy === "apartment" && params?.search) {
			pipeline.push({
				$match: {
					"apartment.number": { $regex: params.search, $options: "i" },
				},
			});
		}

		pipeline.push({
			$project: {
				_id: 1,
				name: 1,
				email: 1,
				phone: 1,
				apartmentId: 1,
				apartmentNumber: "$apartment.number",
				status: 1,
			},
		});

		const residents = await this.collection.aggregate(pipeline).toArray();

		return residents.map((r: any) => ({
			_id: String(r._id),
			name: String(r.name || ""),
			email: String(r.email || ""),
			phone: r.phone ? String(r.phone) : undefined,
			apartmentId: r.apartmentId ? String(r.apartmentId) : undefined,
			apartmentNumber: r.apartmentNumber
				? String(r.apartmentNumber)
				: undefined,
			status: String(r.status || ""),
		}));
	}

	public async findByIdWithApartment(
		_id: string,
		buildingId: string,
	): Promise<{
		_id: string;
		name: string;
		email: string;
		phone: string;
		buildingId: string;
		apartmentId: string;
		status: string;
		photoUrl: string | null;
		residentCode: string;
		rejectType?: string;
		rejectNote?: string;
		inactiveType?: string;
		inactiveNote?: string;
		activatedAt?: string;
		inactivatedAt?: string;
		rejectedAt?: string;
		createdAt: string;
		updatedAt: string;
		apartment: {
			_id: string;
			number: string;
			block: string;
			floor: number;
			status: string;
		} | null;
	} | null> {
		const pipeline: any[] = [
			{ $match: { _id, buildingId } },
			{
				$lookup: {
					from: env.databases.mongodb.collections.apartments,
					localField: "apartmentId",
					foreignField: "_id",
					as: "apartment",
				},
			},
			{
				$project: {
					_id: 1,
					name: 1,
					email: 1,
					phone: 1,
					buildingId: 1,
					apartmentId: 1,
					status: 1,
					photoUrl: 1,
					residentCode: 1,
					rejectType: 1,
					rejectNote: 1,
					inactiveType: 1,
					inactiveNote: 1,
					activatedAt: 1,
					inactivatedAt: 1,
					rejectedAt: 1,
					createdAt: 1,
					updatedAt: 1,
					apartment: {
						$cond: {
							if: { $eq: [{ $size: "$apartment" }, 0] },
							then: null,
							else: {
								$let: {
									vars: { apt: { $arrayElemAt: ["$apartment", 0] } },
									in: {
										_id: "$$apt._id",
										number: "$$apt.number",
										block: "$$apt.block",
										floor: "$$apt.floor",
										status: "$$apt.status",
									},
								},
							},
						},
					},
				},
			},
		];

		const result = await this.collection.aggregate(pipeline).toArray();
		if (result.length === 0) return null;

		const resident = result[0];

		const formatDate = (date: any): string | undefined => {
			if (!date) return undefined;
			if (date instanceof Date) return date.toISOString();
			return new Date(date).toISOString();
		};

		return {
			_id: String(resident._id),
			name: String(resident.name || ""),
			email: String(resident.email || ""),
			phone: String(resident.phone || ""),
			buildingId: String(resident.buildingId || ""),
			apartmentId: String(resident.apartmentId || ""),
			status: String(resident.status || ""),
			photoUrl: resident.photoUrl || null,
			residentCode: String(resident.residentCode || ""),
			rejectType: resident.rejectType ? String(resident.rejectType) : undefined,
			rejectNote: resident.rejectNote ? String(resident.rejectNote) : undefined,
			inactiveType: resident.inactiveType
				? String(resident.inactiveType)
				: undefined,
			inactiveNote: resident.inactiveNote
				? String(resident.inactiveNote)
				: undefined,
			activatedAt: formatDate(resident.activatedAt),
			inactivatedAt: formatDate(resident.inactivatedAt),
			rejectedAt: formatDate(resident.rejectedAt),
			createdAt: formatDate(resident.createdAt) || "",
			updatedAt: formatDate(resident.updatedAt) || "",
			apartment: resident.apartment
				? {
						_id: String(resident.apartment._id),
						number: String(resident.apartment.number || ""),
						block: String(resident.apartment.block || ""),
						floor: Number(resident.apartment.floor || 0),
						status: String(resident.apartment.status || ""),
					}
				: null,
		};
	}
}
