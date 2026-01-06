import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type { RoleEntity } from "../entity/role.entity";

export class RoleRepository {
	private collection: Collection<RoleEntity>;

	constructor(mongoClient: MongoClient) {
		const database = mongoClient.db(env.databases.mongodb.database);
		this.collection = database.collection<RoleEntity>(
			env.databases.mongodb.collections.roles,
		);
	}

	public async findByName(name: string): Promise<RoleEntity | null> {
		return await this.collection.findOne({ name });
	}

	public async findById(_id: string): Promise<RoleEntity | null> {
		return await this.collection.findOne({ _id });
	}

	public async findMany(filter?: Partial<RoleEntity>): Promise<RoleEntity[]> {
		return await this.collection.find(filter || {}).toArray();
	}
}
