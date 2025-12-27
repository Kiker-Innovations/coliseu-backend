import { randomUUID } from "node:crypto";
import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
	CreateAmenityBookingEntity,
	AmenityBookingEntity,
	UpdateAmenityBookingEntity,
} from "../entity/amenity_booking.entity";
import type { IRepository } from "../interfaces/IRepository";
import { getDate } from "@/v1/utils/utils";
import type { AmenityBookingStatusEnumType } from "@/v1/enum/amenityBookingStatus.enum";
import { AmenityBookingStatusEnum } from "@/v1/enum/amenityBookingStatus.enum";

export interface AmenityBookingListFilters {
	amenityId?: string;
	apartmentId?: string;
	status?: AmenityBookingStatusEnumType;
	startDate?: Date;
	endDate?: Date;
}

export class AmenityBookingRepository
	implements
		IRepository<AmenityBookingEntity, CreateAmenityBookingEntity, UpdateAmenityBookingEntity>
{
	private collection: Collection<AmenityBookingEntity>;

	constructor(mongoClient: MongoClient) {
		const database = mongoClient.db(env.databases.mongodb.database);
		this.collection = database.collection<AmenityBookingEntity>(
			env.databases.mongodb.collections.amenityBookings,
		);
	}

	public async create(data: CreateAmenityBookingEntity): Promise<AmenityBookingEntity> {
		const now = getDate();
		const amenityBookingEntity: AmenityBookingEntity = {
			_id: randomUUID(),
			...data,
			createdAt: now,
			updatedAt: now,
		};

		await this.collection.insertOne(amenityBookingEntity);
		return amenityBookingEntity;
	}

	public async findById(_id: string): Promise<AmenityBookingEntity | null> {
		return await this.collection.findOne({ _id });
	}

	public async findOne(
		filter: Partial<AmenityBookingEntity>,
	): Promise<AmenityBookingEntity | null> {
		return await this.collection.findOne(filter);
	}

	public async findMany(
		filter?: Partial<AmenityBookingEntity>,
	): Promise<AmenityBookingEntity[]> {
		return await this.collection.find(filter || {}).toArray();
	}

	public async update(
		_id: string,
		data: UpdateAmenityBookingEntity,
	): Promise<AmenityBookingEntity | null> {
		const updateData = {
			...data,
			updatedAt: getDate(),
		};

		await this.collection.updateOne({ _id }, { $set: updateData });
		return await this.findById(_id);
	}

	public async delete(_id: string): Promise<boolean> {
		const result = await this.collection.deleteOne({ _id });
		return result.deletedCount > 0;
	}

	public async listWithFilters(
		filters: AmenityBookingListFilters | any, // Permitir filtros MongoDB complexos
		page?: number,
		limit?: number,
	): Promise<{ bookings: AmenityBookingEntity[]; total: number }> {
		// Se filters já é um objeto de query MongoDB (com $in, $nin, etc), usar diretamente
		let query: any;
		
		if (filters.amenityId?.$in || filters.status?.$nin || filters.$or) {
			// É uma query MongoDB complexa, usar diretamente
			query = filters;
		} else {
			// É um filtro simples, construir query
			query = {};
			
			if (filters.amenityId) {
				query.amenityId = filters.amenityId;
			}

			if (filters.apartmentId) {
				query.apartmentId = filters.apartmentId;
			}

			if (filters.status) {
				query.status = filters.status;
			}

			if (filters.startDate || filters.endDate) {
				if (filters.startDate && filters.endDate) {
					// Verificar se há sobreposição de datas
					query.$or = [
						{
							$and: [
								{ startDate: { $lte: filters.endDate } },
								{ endDate: { $gte: filters.startDate } },
							],
						},
					];
				} else if (filters.startDate) {
					query.endDate = { $gte: filters.startDate };
				} else if (filters.endDate) {
					query.startDate = { $lte: filters.endDate };
				}
			}
		}

		// Contar total antes da paginação
		const total = await this.collection.countDocuments(query);

		// Aplicar paginação
		let cursor = this.collection.find(query).sort({ startDate: 1 });
		
		if (page !== undefined && limit !== undefined) {
			const skip = (page - 1) * limit;
			cursor = cursor.skip(skip).limit(limit);
		}

		const bookings = await cursor.toArray();

		return { bookings, total };
	}

	public async findConflictingBookings(
		amenityId: string,
		startDate: Date,
		endDate: Date,
		excludeBookingId?: string,
	): Promise<AmenityBookingEntity[]> {
		const query: any = {
			amenityId,
			status: { $in: [AmenityBookingStatusEnum.PENDENTE, AmenityBookingStatusEnum.CONFIRMADO] },
			$or: [
				// Booking starts during another booking
				{
					$and: [
						{ startDate: { $lte: startDate } },
						{ endDate: { $gt: startDate } },
					],
				},
				// Booking ends during another booking
				{
					$and: [
						{ startDate: { $lt: endDate } },
						{ endDate: { $gte: endDate } },
					],
				},
				// Booking completely contains another booking
				{
					$and: [
						{ startDate: { $gte: startDate } },
						{ endDate: { $lte: endDate } },
					],
				},
				// Booking is completely contained by another booking
				{
					$and: [
						{ startDate: { $lte: startDate } },
						{ endDate: { $gte: endDate } },
					],
				},
			],
		};

		if (excludeBookingId) {
			query._id = { $ne: excludeBookingId };
		}

		return await this.collection.find(query).toArray();
	}
}

