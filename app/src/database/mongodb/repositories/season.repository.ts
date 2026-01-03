import { randomUUID } from "node:crypto";
import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
  CreateSeasonEntity,
  SeasonEntity,
  UpdateSeasonEntity,
} from "../entity/season.entity";
import type { IRepository } from "../interfaces/IRepository";
import { getDate } from "@/v1/utils/utils";

export class SeasonRepository
  implements IRepository<SeasonEntity, CreateSeasonEntity, UpdateSeasonEntity>
{
  private collection: Collection<SeasonEntity>;

  constructor(mongoClient: MongoClient) {
    const database = mongoClient.db(env.databases.mongodb.database);
    this.collection = database.collection<SeasonEntity>(
      env.databases.mongodb.collections.seasons
    );
  }

  public async create(data: CreateSeasonEntity): Promise<SeasonEntity> {
    const now = getDate();
    const nextSeasonNumber = await this.getNextSeasonNumber(data.buildingId);

    const seasonEntity: SeasonEntity = {
      _id: randomUUID(),
      ...data,
      seasonNumber: nextSeasonNumber,
      createdAt: now,
      updatedAt: now,
      endDate: null,
    };

    await this.collection.insertOne(seasonEntity);
    return seasonEntity;
  }

  public async findById(_id: string): Promise<SeasonEntity | null> {
    return await this.collection.findOne({ _id });
  }

  public async findByBuildingIdAndSeasonNumber(
    buildingId: string,
    seasonNumber: number
  ): Promise<SeasonEntity | null> {
    return await this.collection.findOne({ buildingId, seasonNumber });
  }

  public async findOne(
    filter: Partial<SeasonEntity>
  ): Promise<SeasonEntity | null> {
    return await this.collection.findOne(filter);
  }

  public async findMany(
    filter?: Partial<SeasonEntity>
  ): Promise<SeasonEntity[]> {
    return await this.collection.find(filter || {}).toArray();
  }

  public async findManyByBuildingId(
    buildingId: string
  ): Promise<SeasonEntity[]> {
    return await this.collection
      .find({ buildingId })
      .sort({ seasonNumber: -1 })
      .toArray();
  }

  public async countOpenSeasonsByBuildingId(
    buildingId: string
  ): Promise<number> {
    return await this.collection.countDocuments({
      buildingId,
      endDate: null,
    });
  }

  public async getNextSeasonNumber(buildingId: string): Promise<number> {
    const lastSeason = await this.collection
      .find({ buildingId })
      .sort({ seasonNumber: -1 })
      .limit(1)
      .toArray();

    return lastSeason.length > 0 ? lastSeason[0].seasonNumber + 1 : 1;
  }

  public async update(
    _id: string,
    data: UpdateSeasonEntity
  ): Promise<SeasonEntity | null> {
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

  public async finish(_id: string): Promise<SeasonEntity | null> {
    const now = getDate();

    const result = await this.collection.findOneAndUpdate(
      { _id },
      { $set: { endDate: now, updatedAt: now } },
      { returnDocument: "after" }
    );

    return result || null;
  }

  public async delete(_id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ _id });
    return result.deletedCount > 0;
  }
}
