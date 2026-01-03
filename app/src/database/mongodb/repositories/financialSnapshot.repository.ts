import { randomUUID } from "node:crypto";
import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
  CreateFinancialSnapshotEntity,
  FinancialSnapshotEntity,
} from "../entity/financialSnapshot.entity";
import { getDate } from "@/v1/utils/utils";

export class FinancialSnapshotRepository {
  private collection: Collection<FinancialSnapshotEntity>;

  constructor(mongoClient: MongoClient) {
    const database = mongoClient.db(env.databases.mongodb.database);
    this.collection = database.collection<FinancialSnapshotEntity>(
      env.databases.mongodb.collections.financialSnapshots
    );
  }

  public async create(
    data: CreateFinancialSnapshotEntity
  ): Promise<FinancialSnapshotEntity> {
    const now = getDate();

    const snapshotEntity: FinancialSnapshotEntity = {
      _id: randomUUID(),
      ...data,
      createdAt: now,
    };

    await this.collection.insertOne(snapshotEntity);
    return snapshotEntity;
  }

  public async findById(_id: string): Promise<FinancialSnapshotEntity | null> {
    return await this.collection.findOne({ _id });
  }

  public async findByBuildingIdAndMonth(
    buildingId: string,
    referenceMonth: string
  ): Promise<FinancialSnapshotEntity | null> {
    return await this.collection.findOne({ buildingId, referenceMonth });
  }

  public async findManyByBuildingId(
    buildingId: string
  ): Promise<FinancialSnapshotEntity[]> {
    return await this.collection
      .find({ buildingId })
      .sort({ referenceMonth: -1 })
      .toArray();
  }

  public async findLatestByBuildingId(
    buildingId: string
  ): Promise<FinancialSnapshotEntity | null> {
    return await this.collection
      .find({ buildingId })
      .sort({ referenceMonth: -1 })
      .limit(1)
      .toArray()
      .then((results) => results[0] || null);
  }

  public async findMany(
    filter?: Partial<FinancialSnapshotEntity>
  ): Promise<FinancialSnapshotEntity[]> {
    return await this.collection
      .find(filter || {})
      .sort({ referenceMonth: -1 })
      .toArray();
  }

  public async delete(_id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ _id });
    return result.deletedCount > 0;
  }
}
