import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../../config/env";

export class S3Provider {
	private s3Client: S3Client;
	private bucketName: string;
	private presignedUrlExpiration: number;

	constructor() {
		this.bucketName = env.providers.aws.s3.bucketName;
		this.presignedUrlExpiration = env.providers.aws.s3.presignedUrlExpiration;

		if (env.app.environment === "local") {
			this.s3Client = new S3Client({
				region: env.providers.aws.config.region,
				credentials: {
					accessKeyId: env.providers.aws.config.accessKeyId,
					secretAccessKey: env.providers.aws.config.secretAccessKey,
				},
			});
		}
		this.s3Client = new S3Client({
			region: env.providers.aws.config.region,
			credentials: {
				accessKeyId: env.providers.aws.config.accessKeyId,
				secretAccessKey: env.providers.aws.config.secretAccessKey,
			},
		});
	}

	public async getPresignedUrlForPut(
		key: string,
		contentType: string,
	): Promise<string> {
		const command = new PutObjectCommand({
			Bucket: this.bucketName,
			Key: key,
			ContentType: contentType,
		});

		const presignedUrl = await getSignedUrl(this.s3Client, command, {
			expiresIn: this.presignedUrlExpiration,
		});

		return presignedUrl;
	}

	public getPublicUrl(key: string): string {
		return `https://${this.bucketName}.s3.${env.providers.aws.config.region}.amazonaws.com/${key}`;
	}
}
