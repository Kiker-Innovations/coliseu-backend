import { randomUUID } from "node:crypto";
import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
  CreateFinancialEntity,
  FinancialEntity,
  UpdateFinancialEntity,
  RecurringExpense,
  OneTimeExpense,
  FundEntry,
} from "../entity/financial.entity";
import type { IRepository } from "../interfaces/IRepository";
import { getDate } from "@/v1/utils/utils";

export class FinancialRepository
  implements
    IRepository<FinancialEntity, CreateFinancialEntity, UpdateFinancialEntity>
{
  private collection: Collection<FinancialEntity>;

  constructor(mongoClient: MongoClient) {
    const database = mongoClient.db(env.databases.mongodb.database);
    this.collection = database.collection<FinancialEntity>(
      env.databases.mongodb.collections.financials
    );
  }

  public async create(data: CreateFinancialEntity): Promise<FinancialEntity> {
    const now = getDate();

    const financialEntity: FinancialEntity = {
      _id: randomUUID(),
      ...data,
      fundEntries: data.fundEntries || [],
      condominiumFund: data.condominiumFund || 0,
      createdAt: now,
      updatedAt: now,
    };

    await this.collection.insertOne(financialEntity);
    return financialEntity;
  }

  public async findById(_id: string): Promise<FinancialEntity | null> {
    return await this.collection.findOne({ _id });
  }

  public async findOne(
    filter: Partial<FinancialEntity>
  ): Promise<FinancialEntity | null> {
    return await this.collection.findOne(filter);
  }

  public async findMany(
    filter?: Partial<FinancialEntity>
  ): Promise<FinancialEntity[]> {
    return await this.collection.find(filter || {}).toArray();
  }

  public async findByBuildingIdAndMonth(
    buildingId: string,
    referenceMonth: string
  ): Promise<FinancialEntity | null> {
    return await this.collection.findOne({ buildingId, referenceMonth });
  }

  public async findCurrentByBuildingId(
    buildingId: string
  ): Promise<FinancialEntity | null> {
    return await this.collection
      .find({ buildingId })
      .sort({ referenceMonth: -1 })
      .limit(1)
      .toArray()
      .then((results) => results[0] || null);
  }

  public async update(
    _id: string,
    data: UpdateFinancialEntity
  ): Promise<FinancialEntity | null> {
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

  public async addRecurringExpense(
    _id: string,
    expense: RecurringExpense
  ): Promise<FinancialEntity | null> {
    const result = await this.collection.findOneAndUpdate(
      { _id },
      {
        $push: { recurringExpenses: expense },
        $set: { updatedAt: getDate() },
      },
      { returnDocument: "after" }
    );

    return result || null;
  }

  public async updateRecurringExpense(
    _id: string,
    expenseId: string,
    expense: Partial<Omit<RecurringExpense, "_id">>
  ): Promise<FinancialEntity | null> {
    const updateFields: Record<string, unknown> = {
      updatedAt: getDate(),
    };

    if (expense.name !== undefined) {
      updateFields["recurringExpenses.$.name"] = expense.name;
    }
    if (expense.value !== undefined) {
      updateFields["recurringExpenses.$.value"] = expense.value;
    }

    const result = await this.collection.findOneAndUpdate(
      { _id, "recurringExpenses._id": expenseId },
      { $set: updateFields },
      { returnDocument: "after" }
    );

    return result || null;
  }

  public async removeRecurringExpense(
    _id: string,
    expenseId: string
  ): Promise<FinancialEntity | null> {
    const result = await this.collection.findOneAndUpdate(
      { _id },
      {
        $pull: { recurringExpenses: { _id: expenseId } },
        $set: { updatedAt: getDate() },
      },
      { returnDocument: "after" }
    );

    return result || null;
  }

  public async addOneTimeExpense(
    _id: string,
    expense: OneTimeExpense
  ): Promise<FinancialEntity | null> {
    const result = await this.collection.findOneAndUpdate(
      { _id },
      {
        $push: { oneTimeExpenses: expense },
        $set: { updatedAt: getDate() },
      },
      { returnDocument: "after" }
    );

    return result || null;
  }

  public async updateOneTimeExpense(
    _id: string,
    expenseId: string,
    expense: Partial<Omit<OneTimeExpense, "_id">>
  ): Promise<FinancialEntity | null> {
    const updateFields: Record<string, unknown> = {
      updatedAt: getDate(),
    };

    if (expense.name !== undefined) {
      updateFields["oneTimeExpenses.$.name"] = expense.name;
    }
    if (expense.description !== undefined) {
      updateFields["oneTimeExpenses.$.description"] = expense.description;
    }
    if (expense.value !== undefined) {
      updateFields["oneTimeExpenses.$.value"] = expense.value;
    }
    if (expense.receiptImageUrl !== undefined) {
      updateFields["oneTimeExpenses.$.receiptImageUrl"] =
        expense.receiptImageUrl;
    }

    const result = await this.collection.findOneAndUpdate(
      { _id, "oneTimeExpenses._id": expenseId },
      { $set: updateFields },
      { returnDocument: "after" }
    );

    return result || null;
  }

  public async removeOneTimeExpense(
    _id: string,
    expenseId: string
  ): Promise<FinancialEntity | null> {
    const result = await this.collection.findOneAndUpdate(
      { _id },
      {
        $pull: { oneTimeExpenses: { _id: expenseId } },
        $set: { updatedAt: getDate() },
      },
      { returnDocument: "after" }
    );

    return result || null;
  }

  public async addFundEntry(
    _id: string,
    entry: FundEntry
  ): Promise<FinancialEntity | null> {
    // Primeiro busca o documento atual para calcular o novo total
    const current = await this.findById(_id);
    if (!current) return null;

    const newTotal = current.condominiumFund + entry.value;

    const result = await this.collection.findOneAndUpdate(
      { _id },
      {
        $push: { fundEntries: entry },
        $set: {
          condominiumFund: newTotal,
          updatedAt: getDate(),
        },
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
