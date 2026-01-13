import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type { RolePlanPageEntity } from "../entity/rolePlanPage.entity";

export class RolePlanPageRepository {
	private collection: Collection<RolePlanPageEntity>;

	constructor(mongoClient: MongoClient) {
		const database = mongoClient.db(env.databases.mongodb.database);
		this.collection = database.collection<RolePlanPageEntity>(
			env.databases.mongodb.collections.rolePlanPages,
		);
	}

	public async findManyByRoleIdAndPlanId(
		roleId: string,
		planId: string,
	): Promise<RolePlanPageEntity[]> {
		return await this.collection.find({ roleId, planId }).toArray();
	}

	public async findMany(
		filter?: Partial<RolePlanPageEntity>,
	): Promise<RolePlanPageEntity[]> {
		return await this.collection.find(filter || {}).toArray();
	}
}
