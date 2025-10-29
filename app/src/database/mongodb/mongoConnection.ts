import { MongoClient, ServerApiVersion } from "mongodb";
import { env } from "../../config/env";

class MongoConnection {
	private static instance: MongoConnection;
	private client: MongoClient;
	private isConnected = false;

	private constructor() {
		this.client = new MongoClient(env.databases.mongodb.url, {
			serverApi: {
				version: ServerApiVersion.v1,
				strict: true,
				deprecationErrors: true,
			},
		});
	}

	public static getInstance(): MongoConnection {
		if (!MongoConnection.instance) {
			MongoConnection.instance = new MongoConnection();
		}
		return MongoConnection.instance;
	}

	public async connect(): Promise<void> {
		if (!this.isConnected) {
			try {
				await this.client.connect();
				await this.client
					.db(env.databases.mongodb.database)
					.command({ ping: 1 });
				this.isConnected = true;
				console.log(
					`✅ Connected to MongoDB successfully! Database: ${env.databases.mongodb.database}`,
				);
			} catch (error) {
				console.error("❌ Failed to connect to MongoDB:", error);
				throw error;
			}
		}
	}

	public async disconnect(): Promise<void> {
		if (this.isConnected) {
			await this.client.close();
			this.isConnected = false;
			console.log("🔌 Disconnected from MongoDB");
		}
	}

	public getClient(): MongoClient {
		if (!this.isConnected) {
			throw new Error("MongoDB client is not connected. Call connect() first.");
		}
		return this.client;
	}

	public isMongoConnected(): boolean {
		return this.isConnected;
	}
}

export const mongoConnection = MongoConnection.getInstance();
