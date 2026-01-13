import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type { ModuleEntity } from "../entity/module.entity";

export class ModuleRepository {
	private collection: Collection<ModuleEntity>;

	constructor(mongoClient: MongoClient) {
		const database = mongoClient.db(env.databases.mongodb.database);
		this.collection = database.collection<ModuleEntity>(
			env.databases.mongodb.collections.modules,
		);
	}

	public async findById(_id: string): Promise<ModuleEntity | null> {
		return await this.collection.findOne({ _id });
	}

	public async findManyByIds(moduleIds: string[]): Promise<ModuleEntity[]> {
		return await this.collection.find({ _id: { $in: moduleIds } }).toArray();
	}

	public async findMany(
		filter?: Partial<ModuleEntity>,
	): Promise<ModuleEntity[]> {
		return await this.collection.find(filter || {}).toArray();
	}
}
