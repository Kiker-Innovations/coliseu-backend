import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type { RolePlanModuleEntity } from "../entity/rolePlanModule.entity";

export class RolePlanModuleRepository {
	private collection: Collection<RolePlanModuleEntity>;

	constructor(mongoClient: MongoClient) {
		const database = mongoClient.db(env.databases.mongodb.database);
		this.collection = database.collection<RolePlanModuleEntity>(
			env.databases.mongodb.collections.rolePlanModules,
		);
	}

	public async findManyByRoleIdAndPlanId(
		roleId: string,
		planId: string,
	): Promise<RolePlanModuleEntity[]> {
		return await this.collection.find({ roleId, planId }).toArray();
	}

	public async findMany(
		filter?: Partial<RolePlanModuleEntity>,
	): Promise<RolePlanModuleEntity[]> {
		return await this.collection.find(filter || {}).toArray();
	}
}
