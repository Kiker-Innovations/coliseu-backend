import type { FastifyInstance } from "fastify";
import { mongoConnection } from "./database/mongodb/mongoConnection";
import { AuthRouteV1 } from "./v1/modules/auth/auth.route";
import { ResidentRouteV1 } from "./v1/modules/resident/resident.route";
import { ConciergeRouteV1 } from "./v1/modules/concierge/concierge.route";
import { AdminRouteV1 } from "./v1/modules/admin/admin.route";

export class Route {
	public registerRoutes = async (server: FastifyInstance): Promise<void> => {
		const mongoClient = mongoConnection.getClient();

		for (const route of [
			...new AuthRouteV1(mongoClient).routes(),
			...new ResidentRouteV1(mongoClient).routes(),
			...new ConciergeRouteV1(mongoClient).routes(),
			...new AdminRouteV1(mongoClient).routes(),
		]) {
			server.route(route);
		}
	};
}
