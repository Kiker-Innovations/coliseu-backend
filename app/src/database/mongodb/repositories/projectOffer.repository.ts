import { randomUUID } from "node:crypto";
import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
	CreateProjectOfferEntity,
	ProjectOfferEntity,
	UpdateProjectOfferEntity,
} from "../entity/projectOffer.entity";
import type { IRepository } from "../interfaces/IRepository";
import { getDate } from "@/v1/utils/utils";

export class ProjectOfferRepository
	implements
		IRepository<
			ProjectOfferEntity,
			CreateProjectOfferEntity,
			UpdateProjectOfferEntity
		>
{
	private collection: Collection<ProjectOfferEntity>;

	constructor(mongoClient: MongoClient) {
		const database = mongoClient.db(env.databases.mongodb.database);
		this.collection = database.collection<ProjectOfferEntity>(
			env.databases.mongodb.collections.projectOffers,
		);
	}

	public async create(
		data: CreateProjectOfferEntity,
	): Promise<ProjectOfferEntity> {
		const now = getDate();

		const projectOfferEntity: ProjectOfferEntity = {
			_id: randomUUID(),
			...data,
			createdAt: now,
			updatedAt: now,
		};

		await this.collection.insertOne(projectOfferEntity);
		return projectOfferEntity;
	}

	public async createMany(
		data: CreateProjectOfferEntity[],
	): Promise<ProjectOfferEntity[]> {
		const now = getDate();

		const projectOfferEntities: ProjectOfferEntity[] = data.map((item) => ({
			_id: randomUUID(),
			...item,
			createdAt: now,
			updatedAt: now,
		}));

		await this.collection.insertMany(projectOfferEntities);
		return projectOfferEntities;
	}

	public async findById(_id: string): Promise<ProjectOfferEntity | null> {
		return await this.collection.findOne({ _id });
	}

	public async findOne(
		filter: Partial<ProjectOfferEntity>,
	): Promise<ProjectOfferEntity | null> {
		return await this.collection.findOne(filter);
	}

	public async findMany(
		filter?: Partial<ProjectOfferEntity>,
	): Promise<ProjectOfferEntity[]> {
		return await this.collection.find(filter || {}).toArray();
	}

	public async findManyByBuildingSeasonAndProject(
		buildingId: string,
		seasonId: string,
		projectId: string,
	): Promise<ProjectOfferEntity[]> {
		return await this.collection
			.find({ buildingId, seasonId, projectId })
			.sort({ votes: -1 })
			.toArray();
	}

	public async findManyByProjectId(
		projectId: string,
	): Promise<ProjectOfferEntity[]> {
		return await this.collection
			.find({ projectId })
			.sort({ votes: -1 })
			.toArray();
	}

	public async findByIds(ids: string[]): Promise<ProjectOfferEntity[]> {
		return await this.collection.find({ _id: { $in: ids } }).toArray();
	}

	public async findPendingPaymentsByOfferIds(
		offerIds: string[],
	): Promise<ProjectOfferEntity[]> {
		return await this.collection
			.find({
				_id: { $in: offerIds },
				$expr: {
					$or: [
						{ $eq: ["$paidInstallments", null] },
						{ $lt: ["$paidInstallments", "$installmentsCount"] },
					],
				},
			})
			.toArray();
	}

	public async update(
		_id: string,
		data: UpdateProjectOfferEntity,
	): Promise<ProjectOfferEntity | null> {
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

	public async incrementVotes(_id: string): Promise<ProjectOfferEntity | null> {
		const result = await this.collection.findOneAndUpdate(
			{ _id },
			{
				$inc: { votes: 1 },
				$set: { updatedAt: getDate() },
			},
			{ returnDocument: "after" },
		);

		return result || null;
	}

	public async delete(_id: string): Promise<boolean> {
		const result = await this.collection.deleteOne({ _id });
		return result.deletedCount > 0;
	}

	public async deleteByProjectId(projectId: string): Promise<boolean> {
		const result = await this.collection.deleteMany({ projectId });
		return result.deletedCount > 0;
	}
}
