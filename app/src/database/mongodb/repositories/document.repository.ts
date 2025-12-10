import { randomUUID } from "node:crypto";
import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
  CreateDocumentEntity,
  DocumentEntity,
  UpdateDocumentEntity,
} from "../entity/document.entity";
import type { IRepository } from "../interfaces/IRepository";
import { getDate } from "@/v1/utils/utils";

export class DocumentRepository
  implements
    IRepository<DocumentEntity, CreateDocumentEntity, UpdateDocumentEntity>
{
  private collection: Collection<DocumentEntity>;

  constructor(mongoClient: MongoClient) {
    const database = mongoClient.db(env.databases.mongodb.database);
    this.collection = database.collection<DocumentEntity>(
      env.databases.mongodb.collections.documents
    );
  }

  public async create(data: CreateDocumentEntity): Promise<DocumentEntity> {
    const now = getDate();
    const documentEntity: DocumentEntity = {
      _id: randomUUID(),
      ...data,
      createdAt: now,
    };

    await this.collection.insertOne(documentEntity);
    return documentEntity;
  }

  public async findById(_id: string): Promise<DocumentEntity | null> {
    return await this.collection.findOne({ _id });
  }

  public async findOne(
    filter: Partial<DocumentEntity>
  ): Promise<DocumentEntity | null> {
    return await this.collection.findOne(filter);
  }

  public async findMany(
    filter?: Partial<DocumentEntity>
  ): Promise<DocumentEntity[]> {
    return await this.collection.find(filter || {}).toArray();
  }

  public async findManyByBuildingId(
    buildingId: string
  ): Promise<DocumentEntity[]> {
    return await this.collection
      .find({ buildingId })
      .sort({ createdAt: -1 })
      .toArray();
  }

  public async update(
    _id: string,
    data: UpdateDocumentEntity
  ): Promise<DocumentEntity | null> {
    const result = await this.collection.findOneAndUpdate(
      { _id },
      { $set: data },
      { returnDocument: "after" }
    );

    return result || null;
  }

  public async delete(_id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ _id });
    return result.deletedCount > 0;
  }
}
