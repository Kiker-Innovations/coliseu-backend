import { randomUUID } from "node:crypto";
import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
	CreateBookingEntity,
	BookingEntity,
	UpdateBookingEntity,
} from "../entity/booking.entity";
import type { IRepository } from "../interfaces/IRepository";
import { getDate } from "@/v1/utils/utils";
import type { BookingStatusEnumType } from "@/v1/enum/bookingStatus.enum";
import { BookingStatusEnum } from "@/v1/enum/bookingStatus.enum";

export interface BookingListFilters {
	amenityId?: string;
	apartmentId?: string;
	status?: BookingStatusEnumType;
	startDate?: Date;
	endDate?: Date;
}

export class BookingRepository
	implements
		IRepository<
			BookingEntity,
			CreateBookingEntity,
			UpdateBookingEntity
		>
{
	private collection: Collection<BookingEntity>;

	constructor(mongoClient: MongoClient) {
		const database = mongoClient.db(env.databases.mongodb.database);
		this.collection = database.collection<BookingEntity>(
			env.databases.mongodb.collections.bookings,
		);
	}

	public async create(
		data: CreateBookingEntity,
	): Promise<BookingEntity> {
		const now = getDate();
		const bookingEntity: BookingEntity = {
			_id: randomUUID(),
			...data,
			createdAt: now,
			updatedAt: now,
		};

		await this.collection.insertOne(bookingEntity);
		return bookingEntity;
	}

	public async findById(_id: string): Promise<BookingEntity | null> {
		return await this.collection.findOne({ _id });
	}

	public async findOne(
		filter: Partial<BookingEntity>,
	): Promise<BookingEntity | null> {
		return await this.collection.findOne(filter);
	}

	public async findMany(
		filter?: Partial<BookingEntity> | any, // Permitir queries MongoDB complexas
	): Promise<BookingEntity[]> {
		// Se filter já é um objeto de query MongoDB (com $gte, $lte, $in, etc), usar diretamente
		return await this.collection.find(filter || {}).toArray();
	}

	public async update(
		_id: string,
		data: UpdateBookingEntity,
	): Promise<BookingEntity | null> {
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
		filters: BookingListFilters | any, // Permitir filtros MongoDB complexos
		page?: number,
		limit?: number,
	): Promise<{ bookings: BookingEntity[]; total: number }> {
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
	): Promise<BookingEntity[]> {
		const query: any = {
			amenityId,
			status: {
				$in: [
					BookingStatusEnum.PENDENTE,
					BookingStatusEnum.AGENDADO,
				],
			},
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

