import type { FastifyInstance } from "fastify";
import { mongoConnection } from "./database/mongodb/mongoConnection";
import { ResidentRouteV1 } from "./v1/modules/resident/resident.route";

export class Route {
	public registerRoutes = async (server: FastifyInstance): Promise<void> => {
		const mongoClient = mongoConnection.getClient();

		for (const route of [...new ResidentRouteV1(mongoClient).routes()]) {
			server.route(route);
		}
	};
}
