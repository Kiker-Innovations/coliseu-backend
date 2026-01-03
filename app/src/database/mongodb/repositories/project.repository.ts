import { randomUUID } from "node:crypto";
import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
  CreateProjectEntity,
  ProjectEntity,
  UpdateProjectEntity,
} from "../entity/project.entity";
import type { IRepository } from "../interfaces/IRepository";
import { getDate } from "@/v1/utils/utils";

export class ProjectRepository
  implements
    IRepository<ProjectEntity, CreateProjectEntity, UpdateProjectEntity>
{
  private collection: Collection<ProjectEntity>;

  constructor(mongoClient: MongoClient) {
    const database = mongoClient.db(env.databases.mongodb.database);
    this.collection = database.collection<ProjectEntity>(
      env.databases.mongodb.collections.projects
    );
  }

  public async create(data: CreateProjectEntity): Promise<ProjectEntity> {
    const now = getDate();

    const projectEntity: ProjectEntity = {
      _id: randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    await this.collection.insertOne(projectEntity);
    return projectEntity;
  }

  public async findById(_id: string): Promise<ProjectEntity | null> {
    return await this.collection.findOne({ _id });
  }

  public async findOne(
    filter: Partial<ProjectEntity>
  ): Promise<ProjectEntity | null> {
    return await this.collection.findOne(filter);
  }

  public async findMany(
    filter?: Partial<ProjectEntity>
  ): Promise<ProjectEntity[]> {
    return await this.collection.find(filter || {}).toArray();
  }

  public async findManyByBuildingIdAndSeasonId(
    buildingId: string,
    fromSeasonId: string
  ): Promise<ProjectEntity[]> {
    return await this.collection
      .find({ buildingId, fromSeasonId })
      .sort({ votes: -1 })
      .toArray();
  }

  public async findManyByBuildingId(
    buildingId: string
  ): Promise<ProjectEntity[]> {
    return await this.collection
      .find({ buildingId })
      .sort({ createdAt: -1 })
      .toArray();
  }

  public async findManyWithChosenOfferByBuildingId(
    buildingId: string
  ): Promise<ProjectEntity[]> {
    return await this.collection
      .find({
        buildingId,
        chosenOfferId: { $exists: true, $ne: null },
      })
      .sort({ createdAt: -1 })
      .toArray();
  }

  public async update(
    _id: string,
    data: UpdateProjectEntity
  ): Promise<ProjectEntity | null> {
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

  public async incrementVotes(_id: string): Promise<ProjectEntity | null> {
    const result = await this.collection.findOneAndUpdate(
      { _id },
      {
        $inc: { votes: 1 },
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
}
