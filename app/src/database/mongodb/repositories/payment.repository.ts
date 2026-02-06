import { randomUUID } from "node:crypto";
import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
	CreatePaymentEntity,
	PaymentEntity,
	UpdatePaymentEntity,
} from "../entity/payment.entity";
import type { IRepository } from "../interfaces/IRepository";
import { getDate } from "@/v1/utils/utils";

export class PaymentRepository
	implements
		IRepository<PaymentEntity, CreatePaymentEntity, UpdatePaymentEntity>
{
	private collection: Collection<PaymentEntity>;

	constructor(mongoClient: MongoClient) {
		const database = mongoClient.db(env.databases.mongodb.database);
		this.collection = database.collection<PaymentEntity>(
			env.databases.mongodb.collections.payments,
		);
	}

	public async create(data: CreatePaymentEntity): Promise<PaymentEntity> {
		const now = getDate();
		const paymentEntity: PaymentEntity = {
			_id: randomUUID(),
			...data,
			createdAt: now,
			updatedAt: now,
		};

		await this.collection.insertOne(paymentEntity);
		return paymentEntity;
	}

	public async findById(_id: string): Promise<PaymentEntity | null> {
		return await this.collection.findOne({ _id });
	}

	public async findOne(
		filter: Partial<PaymentEntity>,
	): Promise<PaymentEntity | null> {
		return await this.collection.findOne(filter);
	}

	public async findMany(
		filter?: Partial<PaymentEntity>,
	): Promise<PaymentEntity[]> {
		const query = filter || {};
		return await this.collection.find(query).toArray();
	}

	public async findByPaymentOriginId(
		paymentOriginId: string,
	): Promise<PaymentEntity | null> {
		return await this.collection.findOne({ paymentOriginId });
	}

	public async findByEntityOriginId(
		entityOriginId: string,
	): Promise<PaymentEntity | null> {
		return await this.collection.findOne({ entityOriginId });
	}

	public async findManyByBuildingId(
		buildingId: string,
	): Promise<PaymentEntity[]> {
		return await this.collection
			.find({ buildingId })
			.sort({ createdAt: -1 })
			.toArray();
	}

	public async findManyByResidentId(
		residentId: string,
	): Promise<PaymentEntity[]> {
		return await this.collection
			.find({ residentId })
			.sort({ createdAt: -1 })
			.toArray();
	}

	public async update(
		_id: string,
		data: UpdatePaymentEntity,
	): Promise<PaymentEntity | null> {
		const now = getDate();
		const updateData = {
			...data,
			updatedAt: now,
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
}
