import { randomUUID } from "node:crypto";
import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
  CreateProjectSuggestionPollEntity,
  ProjectSuggestionPollEntity,
  UpdateProjectSuggestionPollEntity,
} from "../entity/projectSuggestionPoll.entity";
import type { IRepository } from "../interfaces/IRepository";
import { getDate } from "@/v1/utils/utils";

export class ProjectSuggestionPollRepository
  implements
    IRepository<
      ProjectSuggestionPollEntity,
      CreateProjectSuggestionPollEntity,
      UpdateProjectSuggestionPollEntity
    >
{
  private collection: Collection<ProjectSuggestionPollEntity>;

  constructor(mongoClient: MongoClient) {
    const database = mongoClient.db(env.databases.mongodb.database);
    this.collection = database.collection<ProjectSuggestionPollEntity>(
      env.databases.mongodb.collections.projectSuggestionPolls
    );
  }

  public async create(
    data: CreateProjectSuggestionPollEntity
  ): Promise<ProjectSuggestionPollEntity> {
    const now = getDate();
    const pollEntity: ProjectSuggestionPollEntity = {
      _id: randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    await this.collection.insertOne(pollEntity);
    return pollEntity;
  }

  public async findById(
    _id: string
  ): Promise<ProjectSuggestionPollEntity | null> {
    return await this.collection.findOne({ _id });
  }

  public async findOne(
    filter: Partial<ProjectSuggestionPollEntity>
  ): Promise<ProjectSuggestionPollEntity | null> {
    return await this.collection.findOne(filter);
  }

  public async findMany(
    filter?: Partial<ProjectSuggestionPollEntity>
  ): Promise<ProjectSuggestionPollEntity[]> {
    return await this.collection.find(filter || {}).toArray();
  }

  public async findByProjectSuggestionIdAndResidentId(
    projectSuggestionId: string,
    residentId: string
  ): Promise<ProjectSuggestionPollEntity | null> {
    return await this.collection.findOne({
      projectSuggestionId,
      residentId,
    });
  }

  public async findManyByResidentId(
    residentId: string
  ): Promise<ProjectSuggestionPollEntity[]> {
    return await this.collection.find({ residentId }).toArray();
  }

  public async findManyByProjectSuggestionIds(
    projectSuggestionIds: string[]
  ): Promise<ProjectSuggestionPollEntity[]> {
    return await this.collection
      .find({ projectSuggestionId: { $in: projectSuggestionIds } })
      .toArray();
  }

  public async sumVotesByResidentIdAndProjectSuggestionIds(
    residentId: string,
    projectSuggestionIds: string[]
  ): Promise<number> {
    const result = await this.collection
      .aggregate([
        {
          $match: {
            residentId,
            projectSuggestionId: { $in: projectSuggestionIds },
          },
        },
        {
          $group: {
            _id: null,
            totalVotes: { $sum: "$voteCount" },
          },
        },
      ])
      .toArray();

    return result.length > 0 ? result[0].totalVotes : 0;
  }

  public async update(
    _id: string,
    data: UpdateProjectSuggestionPollEntity
  ): Promise<ProjectSuggestionPollEntity | null> {
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

  public async incrementVoteCount(
    _id: string,
    count: number = 1
  ): Promise<ProjectSuggestionPollEntity | null> {
    const result = await this.collection.findOneAndUpdate(
      { _id },
      {
        $inc: { voteCount: count },
        $set: { updatedAt: getDate() },
      },
      { returnDocument: "after" }
    );

    return result || null;
  }

  public async delete(_id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ _id });
    return result.deletedCount > 0;
  }

  public async deleteByProjectSuggestionId(
    projectSuggestionId: string
  ): Promise<number> {
    const result = await this.collection.deleteMany({ projectSuggestionId });
    return result.deletedCount;
  }

  public async deleteByProjectSuggestionIds(
    projectSuggestionIds: string[]
  ): Promise<number> {
    const result = await this.collection.deleteMany({
      projectSuggestionId: { $in: projectSuggestionIds },
    });
    return result.deletedCount;
  }
}
