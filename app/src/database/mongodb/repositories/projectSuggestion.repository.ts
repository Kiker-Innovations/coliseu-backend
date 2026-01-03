import { randomUUID } from "node:crypto";
import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
  CreateProjectSuggestionEntity,
  ProjectSuggestionEntity,
  UpdateProjectSuggestionEntity,
} from "../entity/projectSuggestion.entity";
import type { IRepository } from "../interfaces/IRepository";
import { getDate } from "@/v1/utils/utils";
import { ProjectSuggestionStatusEnum, type ProjectSuggestionStatusEnumType } from "@/v1/enum/projectSuggestionStatus.enum";

export class ProjectSuggestionRepository
  implements
    IRepository<
      ProjectSuggestionEntity,
      CreateProjectSuggestionEntity,
      UpdateProjectSuggestionEntity
    >
{
  private collection: Collection<ProjectSuggestionEntity>;

  constructor(mongoClient: MongoClient) {
    const database = mongoClient.db(env.databases.mongodb.database);
    this.collection = database.collection<ProjectSuggestionEntity>(
      env.databases.mongodb.collections.projectSuggestions
    );
  }

  public async create(
    data: CreateProjectSuggestionEntity
  ): Promise<ProjectSuggestionEntity> {
    const now = getDate();
    const projectSuggestionEntity: ProjectSuggestionEntity = {
      _id: randomUUID(),
      ...data,
      votes: 0,
      votingStartDate: null,
      votingEndDate: null,
      createdAt: now,
      updatedAt: now,
    };

    await this.collection.insertOne(projectSuggestionEntity);
    return projectSuggestionEntity;
  }

  public async createMany(
    data: CreateProjectSuggestionEntity[]
  ): Promise<ProjectSuggestionEntity[]> {
    const now = getDate();
    const entities: ProjectSuggestionEntity[] = data.map((item) => ({
      _id: randomUUID(),
      ...item,
      votes: 0,
      votingStartDate: null,
      votingEndDate: null,
      createdAt: now,
      updatedAt: now,
    }));

    await this.collection.insertMany(entities);
    return entities;
  }

  public async findById(_id: string): Promise<ProjectSuggestionEntity | null> {
    return await this.collection.findOne({ _id });
  }

  public async findOne(
    filter: Partial<ProjectSuggestionEntity>
  ): Promise<ProjectSuggestionEntity | null> {
    return await this.collection.findOne(filter);
  }

  public async findMany(
    filter?: Partial<ProjectSuggestionEntity>
  ): Promise<ProjectSuggestionEntity[]> {
    return await this.collection.find(filter || {}).toArray();
  }

  public async findBySeasonId(
    seasonId: string
  ): Promise<ProjectSuggestionEntity[]> {
    return await this.collection.find({ seasonId }).sort({ rank: 1 }).toArray();
  }

  public async findBySeasonIdAndStatus(
    seasonId: string,
    status: string
  ): Promise<ProjectSuggestionEntity[]> {
    return await this.collection
      .find({ seasonId, status: status as ProjectSuggestionStatusEnumType })
      .sort({ rank: 1 })
      .toArray();
  }

  public async findByBuildingIdAndSeasonId(
    buildingId: string,
    seasonId: string
  ): Promise<ProjectSuggestionEntity[]> {
    return await this.collection
      .find({ buildingId, seasonId })
      .sort({ rank: 1 })
      .toArray();
  }

  public async findTopByVotes(
    seasonId: string,
    limit: number
  ): Promise<ProjectSuggestionEntity[]> {
    return await this.collection
      .find({ seasonId, status: ProjectSuggestionStatusEnum.VOTACAO_ENCERRADA })
      .sort({ votes: -1, rank: 1 })
      .limit(limit)
      .toArray();
  }

  public async update(
    _id: string,
    data: UpdateProjectSuggestionEntity
  ): Promise<ProjectSuggestionEntity | null> {
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

  public async updateManyBySeasonId(
    seasonId: string,
    data: UpdateProjectSuggestionEntity
  ): Promise<boolean> {
    const updateData = {
      ...data,
      updatedAt: getDate(),
    };

    const result = await this.collection.updateMany(
      { seasonId },
      { $set: updateData }
    );

    return result.modifiedCount > 0;
  }

  public async incrementVotes(
    _id: string,
    count: number
  ): Promise<ProjectSuggestionEntity | null> {
    const result = await this.collection.findOneAndUpdate(
      { _id },
      {
        $inc: { votes: count },
        $set: { updatedAt: getDate() },
      },
      { returnDocument: "after" }
    );

    return result || null;
  }

  public async decrementVotes(
    _id: string,
    count: number
  ): Promise<ProjectSuggestionEntity | null> {
    const result = await this.collection.findOneAndUpdate(
      { _id },
      {
        $inc: { votes: -count },
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

  public async deleteBySeasonId(seasonId: string): Promise<boolean> {
    const result = await this.collection.deleteMany({ seasonId });
    return result.deletedCount > 0;
  }

  public async countBySeasonId(seasonId: string): Promise<number> {
    return await this.collection.countDocuments({ seasonId });
  }
}
