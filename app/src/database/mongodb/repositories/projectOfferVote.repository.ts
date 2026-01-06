import { randomUUID } from "node:crypto";
import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
	CreateProjectOfferVoteEntity,
	ProjectOfferVoteEntity,
	UpdateProjectOfferVoteEntity,
} from "../entity/projectOfferVote.entity";
import type { IRepository } from "../interfaces/IRepository";
import { getDate } from "@/v1/utils/utils";

export class ProjectOfferVoteRepository
	implements
		IRepository<
			ProjectOfferVoteEntity,
			CreateProjectOfferVoteEntity,
			UpdateProjectOfferVoteEntity
		>
{
	private collection: Collection<ProjectOfferVoteEntity>;

	constructor(mongoClient: MongoClient) {
		const database = mongoClient.db(env.databases.mongodb.database);
		this.collection = database.collection<ProjectOfferVoteEntity>(
			env.databases.mongodb.collections.projectOfferVotes,
		);
	}

	public async create(
		data: CreateProjectOfferVoteEntity,
	): Promise<ProjectOfferVoteEntity> {
		const now = getDate();

		const projectOfferVoteEntity: ProjectOfferVoteEntity = {
			_id: randomUUID(),
			...data,
			createdAt: now,
			updatedAt: now,
		};

		await this.collection.insertOne(projectOfferVoteEntity);
		return projectOfferVoteEntity;
	}

	public async findById(_id: string): Promise<ProjectOfferVoteEntity | null> {
		return await this.collection.findOne({ _id });
	}

	public async findOne(
		filter: Partial<ProjectOfferVoteEntity>,
	): Promise<ProjectOfferVoteEntity | null> {
		return await this.collection.findOne(filter);
	}

	public async findMany(
		filter?: Partial<ProjectOfferVoteEntity>,
	): Promise<ProjectOfferVoteEntity[]> {
		return await this.collection.find(filter || {}).toArray();
	}

	public async findByProjectIdAndResidentId(
		projectId: string,
		residentId: string,
	): Promise<ProjectOfferVoteEntity | null> {
		return await this.collection.findOne({ projectId, residentId });
	}

	public async findByProjectIdAndApartmentId(
		projectId: string,
		apartmentId: string,
	): Promise<ProjectOfferVoteEntity | null> {
		return await this.collection.findOne({ projectId, apartmentId });
	}

	public async countByProjectId(projectId: string): Promise<number> {
		return await this.collection.countDocuments({ projectId });
	}

	public async update(
		_id: string,
		data: UpdateProjectOfferVoteEntity,
	): Promise<ProjectOfferVoteEntity | null> {
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

	public async deleteByProjectId(projectId: string): Promise<boolean> {
		const result = await this.collection.deleteMany({ projectId });
		return result.deletedCount > 0;
	}
}
