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
import { VisitorRouteV1 } from "./v1/modules/visitor/visitor.route";
import { VisitRouteV1 } from "./v1/modules/visit/visit.route";
import { FinancialRouteV1 } from "./v1/modules/financial/financial.route";
import { DocumentRouteV1 } from "./v1/modules/document/document.route";
import { AmenityRouteV1 } from "./v1/modules/amenity/amenity.route";
import { AmenityBookingRouteV1 } from "./v1/modules/amenity_booking/amenity_booking.route";
import { NoticeRouteV1 } from "./v1/modules/notice/notice.route";

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
      ...new VisitorRouteV1(mongoClient).routes(),
      ...new VisitRouteV1(mongoClient).routes(),
      ...new FinancialRouteV1(mongoClient).routes(),
      ...new DocumentRouteV1(mongoClient).routes(),
      ...new AmenityRouteV1(mongoClient).routes(),
      ...new AmenityBookingRouteV1(mongoClient).routes(),
      ...new NoticeRouteV1(mongoClient).routes(),
    ]) {
      server.route(route);
    }
  };
}
