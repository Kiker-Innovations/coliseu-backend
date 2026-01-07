import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type { BuildingPageEntity } from "../entity/buildingPage.entity";

export class BuildingPageRepository {
	private collection: Collection<BuildingPageEntity>;

	constructor(mongoClient: MongoClient) {
		const database = mongoClient.db(env.databases.mongodb.database);
		this.collection = database.collection<BuildingPageEntity>(
			env.databases.mongodb.collections.buildingPages,
		);
	}

	public async findManyByBuildingId(
		buildingId: string,
	): Promise<BuildingPageEntity[]> {
		return await this.collection.find({ buildingId, isActive: true }).toArray();
	}

	public async findMany(
		filter?: Partial<BuildingPageEntity>,
	): Promise<BuildingPageEntity[]> {
		return await this.collection.find(filter || {}).toArray();
	}
}
