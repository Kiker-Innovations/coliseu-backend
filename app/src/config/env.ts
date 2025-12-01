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
				suggestions: z.string().min(1),
				polls: z.string().min(1),
				pollVotes: z.string().min(1),
				seasons: z.string().min(1),
			}),
		}),
	}),
	providers: z.object({
		resend: z.object({
			apiKey: z.string().min(1),
		}),
		aws: z.object({
			config: z.object({
				region: z.string().min(1),
				accessKeyId: z.string().min(1),
				secretAccessKey: z.string().min(1),
			}),
			s3: z.object({
				bucketName: z.string().min(1),
				endpoint: z.string().url().optional(),
				presignedUrlExpiration: z.number().int().positive(),
				folders: z.object({
					resident: z.string().min(1),
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
				suggestions: process.env.MONGODB_COLLECTION_SUGGESTIONS || "suggestions",
				polls: process.env.MONGODB_COLLECTION_POLLS || "polls",
				pollVotes: process.env.MONGODB_COLLECTION_POLL_VOTES || "poll_votes",
				seasons: process.env.MONGODB_COLLECTION_SEASONS || "seasons",
			},
		},
	},
	providers: {
		resend: {
			apiKey: process.env.RESEND_API_KEY,
		},
		aws: {
			config: {
				region: process.env.AWS_REGION,
				accessKeyId: process.env.AWS_ACCESS_KEY_ID,
				secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
			},
			s3: {
				bucketName: process.env.AWS_S3_BUCKET_NAME,
				presignedUrlExpiration: Number(
					process.env.AWS_S3_PRESIGNED_URL_EXPIRATION,
				),
				folders: {
					resident: process.env.AWS_S3_FOLDER_RESIDENT,
				},
			},
			ses: {
				fromEmail: process.env.AWS_SES_FROM_EMAIL,
			},
		},
	},
});
