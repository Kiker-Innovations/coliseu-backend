import type { FastifyInstance } from "fastify";
import { mongoConnection } from "./database/mongodb/mongoConnection";
import { AuthRouteV1 } from "./v1/modules/auth/auth.route";
import { ResidentRouteV1 } from "./v1/modules/resident/resident.route";
import { ConciergeRouteV1 } from "./v1/modules/concierge/concierge.route";
import { AdminRouteV1 } from "./v1/modules/admin/admin.route";
import { BuildingRouteV1 } from "./v1/modules/building/building.route";
import { PackageRouteV1 } from "./v1/modules/package/package.route";
import { ApartmentRouteV1 } from "./v1/modules/apartment/apartment.route";
import { PollRouteV1 } from "./v1/modules/poll/poll.route";
import { ResidentSuggestionRouteV1 } from "./v1/modules/residentSuggestion/residentSuggestion.route";
import { SeasonRouteV1 } from "./v1/modules/season/season.route";
import { ProjectRouteV1 } from "./v1/modules/project/project.route";
import { ProjectOfferRouteV1 } from "./v1/modules/projectOffer/projectOffer.route";
import { ProjectSuggestionRouteV1 } from "./v1/modules/projectSuggestion/projectSuggestion.route";
import { ProjectSuggestionPollRouteV1 } from "./v1/modules/projectSuggestionPoll/projectSuggestionPoll.route";

export class Route {
  public registerRoutes = async (server: FastifyInstance): Promise<void> => {
    const mongoClient = mongoConnection.getClient();

    for (const route of [
      ...new AuthRouteV1(mongoClient).routes(),
      ...new ResidentRouteV1(mongoClient).routes(),
      ...new ConciergeRouteV1(mongoClient).routes(),
      ...new AdminRouteV1(mongoClient).routes(),
      ...new BuildingRouteV1(mongoClient).routes(),
      ...new PackageRouteV1(mongoClient).routes(),
      ...new ApartmentRouteV1(mongoClient).routes(),
      ...new PollRouteV1(mongoClient).routes(),
      ...new ResidentSuggestionRouteV1(mongoClient).routes(),
      ...new SeasonRouteV1(mongoClient).routes(),
      ...new ProjectRouteV1(mongoClient).routes(),
      ...new ProjectOfferRouteV1(mongoClient).routes(),
      ...new ProjectSuggestionRouteV1(mongoClient).routes(),
      ...new ProjectSuggestionPollRouteV1(mongoClient).routes(),
    ]) {
      server.route(route);
    }
  };
}
