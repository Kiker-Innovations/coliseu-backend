import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type { PageEntity } from "../entity/page.entity";

export class PageRepository {
	private collection: Collection<PageEntity>;

	constructor(mongoClient: MongoClient) {
		const database = mongoClient.db(env.databases.mongodb.database);
		this.collection = database.collection<PageEntity>(
			env.databases.mongodb.collections.pages,
		);
	}

	public async findById(_id: string): Promise<PageEntity | null> {
		return await this.collection.findOne({ _id });
	}

	public async findManyByIds(pageIds: string[]): Promise<PageEntity[]> {
		return await this.collection.find({ _id: { $in: pageIds } }).toArray();
	}

	public async findManyByRoleId(roleId: string): Promise<PageEntity[]> {
		return await this.collection
			.find({ roleId, isActive: true })
			.sort({ order: 1 })
			.toArray();
	}

	public async findMany(filter?: Partial<PageEntity>): Promise<PageEntity[]> {
		return await this.collection.find(filter || {}).toArray();
	}
}
