import { z } from "zod";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, "../../package.json");
const application = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

const envSchema = z.object({
	app: z.object({
		port: z.number().int().positive().optional(),
		environment: z.string().min(1).optional(),
		baseUrl: z.string().url(),
		jwtSecret: z.string().min(1),
		jwtExpiration: z.string().min(1).default("7d"),
		jwtRefreshExpiration: z.string().min(1).default("30d"),
	}),
	plugins: z.object({
		swagger: z.object({
			basePath: z.string().min(1),
		}),
	}),
	stripPrefix: z.object({
		path: z.string().min(1),
	}),
	databases: z.object({
		mongodb: z.object({
			url: z.string().url().min(1),
			database: z.string().min(1),
			collections: z.object({
				residents: z.string().min(1),
				concierges: z.string().min(1),
				admins: z.string().min(1),
				buildings: z.string().min(1),
				packages: z.string().min(1),
				apartments: z.string().min(1),
				amenities: z.string().min(1),
				residentSuggestions: z.string().min(1),
				polls: z.string().min(1),
				pollVotes: z.string().min(1),
				seasons: z.string().min(1),
				projects: z.string().min(1),
				projectOffers: z.string().min(1),
				projectSuggestions: z.string().min(1),
				projectSuggestionPolls: z.string().min(1),
				projectOfferVotes: z.string().min(1),
				visitors: z.string().min(1),
				visits: z.string().min(1),
				financials: z.string().min(1),
				financialSnapshots: z.string().min(1),
				documents: z.string().min(1),
				amenityBookings: z.string().min(1),
				notices: z.string().min(1),
				infractions: z.string().min(1),
				fines: z.string().min(1),
				infractionAppeals: z.string().min(1),
				roles: z.string().min(1),
				pages: z.string().min(1),
				buildingPages: z.string().min(1),
				plans: z.string().min(1),
				rolePlanModules: z.string().min(1),
				modules: z.string().min(1),
			}),
		}),
	}),
	providers: z.object({
		resend: z.object({
			apiKey: z.string().min(1),
		}),
		aws: z.object({
			config: z.object({
				region: z.string().min(1).optional(),
				accessKeyId: z.string().min(1).optional(),
				secretAccessKey: z.string().min(1).optional(),
			}),
			s3: z.object({
				bucketName: z.string().min(1),
				endpoint: z.string().url().optional(),
				presignedUrlExpiration: z.number().int().positive(),
				folders: z.object({
					resident: z.string().min(1),
					visitor: z.string().min(1),
					documents: z.string().min(1),
					notices: z.string().min(1),
					infractions: z.string().min(1),
				}),
			}),
			ses: z.object({
				fromEmail: z.string().email().min(1),
			}),
		}),
	}),
});

export const env = envSchema.parse({
	app: {
		port: Number(process.env.PORT),
		environment: process.env.APP_ENVIRONMENT,
		baseUrl: process.env.APP_BASE_URL,
		jwtSecret: process.env.JWT_SECRET,
		jwtExpiration: process.env.JWT_EXPIRATION || "7d",
		jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || "30d",
	},
	plugins: {
		swagger: {
			basePath: Object.is(process.env.USE_ROUTE_PREFIX, "true")
				? `/api/${application.name.replace(/-/g, "")}/`
				: "/",
		},
	},
	stripPrefix: {
		path: `/api/${application.name.replace(/-/g, "")}`,
	},
	databases: {
		mongodb: {
			url: process.env.MONGODB_URL,
			database: process.env.MONGODB_DATABASE,
			collections: {
				residents: process.env.MONGODB_COLLECTION_RESIDENTS || "residents",
				concierges: process.env.MONGODB_COLLECTION_CONCIERGES || "concierges",
				admins: process.env.MONGODB_COLLECTION_ADMINS || "admins",
				buildings: process.env.MONGODB_COLLECTION_BUILDINGS || "buildings",
				packages: process.env.MONGODB_COLLECTION_PACKAGES || "packages",
				apartments: process.env.MONGODB_COLLECTION_APARTMENTS || "apartments",
				amenities: process.env.MONGODB_COLLECTION_AMENITIES || "amenities",
				residentSuggestions:
					process.env.MONGODB_COLLECTION_RESIDENT_SUGGESTIONS ||
					"resident_suggestions",
				polls: process.env.MONGODB_COLLECTION_POLLS || "polls",
				pollVotes: process.env.MONGODB_COLLECTION_POLL_VOTES || "poll_votes",
				seasons: process.env.MONGODB_COLLECTION_SEASONS || "seasons",
				projects: process.env.MONGODB_COLLECTION_PROJECTS || "projects",
				projectOffers:
					process.env.MONGODB_COLLECTION_PROJECT_OFFERS || "project_offers",
				projectSuggestions:
					process.env.MONGODB_COLLECTION_PROJECT_SUGGESTIONS ||
					"project_suggestions",
				projectSuggestionPolls:
					process.env.MONGODB_COLLECTION_PROJECT_SUGGESTION_POLLS ||
					"project_suggestion_polls",
				projectOfferVotes:
					process.env.MONGODB_COLLECTION_PROJECT_OFFER_VOTES ||
					"project_offer_votes",
				visitors: process.env.MONGODB_COLLECTION_VISITORS || "visitors",
				visits: process.env.MONGODB_COLLECTION_VISITS || "visits",
				financials: process.env.MONGODB_COLLECTION_FINANCIALS || "financials",
				financialSnapshots:
					process.env.MONGODB_COLLECTION_FINANCIAL_SNAPSHOTS ||
					"financial_snapshots",
				documents: process.env.MONGODB_COLLECTION_DOCUMENTS || "documents",
				amenityBookings:
					process.env.MONGODB_COLLECTION_AMENITY_BOOKINGS || "amenity_bookings",
				notices: process.env.MONGODB_COLLECTION_NOTICES || "notices",
				infractions:
					process.env.MONGODB_COLLECTION_INFRACTIONS || "infractions",
				fines: process.env.MONGODB_COLLECTION_FINES || "fines",
				infractionAppeals:
					process.env.MONGODB_COLLECTION_INFRACTION_APPEALS ||
					"infraction_appeals",
				roles: process.env.MONGODB_COLLECTION_ROLES || "roles",
				pages: process.env.MONGODB_COLLECTION_PAGES || "pages",
				buildingPages:
					process.env.MONGODB_COLLECTION_BUILDING_PAGES || "building_pages",
				plans: process.env.MONGODB_COLLECTION_PLANS || "plans",
				rolePlanModules:
					process.env.MONGODB_COLLECTION_ROLE_PLAN_MODULES ||
					"role_plan_modules",
				modules: process.env.MONGODB_COLLECTION_MODULES || "modules",
			},
		},
	},
	providers: {
		resend: {
			apiKey: process.env.RESEND_API_KEY,
		},
		aws: {
			config: {
				region: process.env.AWS_REGION || "us-east-1",
				accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
				secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
			},
			s3: {
				bucketName: process.env.AWS_S3_BUCKET_NAME,
				presignedUrlExpiration: Number(
					process.env.AWS_S3_PRESIGNED_URL_EXPIRATION,
				),
				folders: {
					resident: process.env.AWS_S3_FOLDER_RESIDENT,
					visitor: process.env.AWS_S3_FOLDER_VISITOR || "visitors",
					documents: process.env.AWS_S3_FOLDER_DOCUMENTS || "documents",
					notices: process.env.AWS_S3_FOLDER_NOTICES || "notices",
					infractions: process.env.AWS_S3_FOLDER_INFRACTIONS || "infractions",
				},
			},
			ses: {
				fromEmail: process.env.AWS_SES_FROM_EMAIL,
			},
		},
	},
});
