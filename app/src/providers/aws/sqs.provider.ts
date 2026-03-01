import {
	SQSClient,
	SendMessageCommand,
	type SendMessageCommandInput,
} from "@aws-sdk/client-sqs";
import { env } from "../../config/env";

export interface SQSSendMessageOptions {
	queueUrl: string;
	messageBody: string;
	messageGroupId: string;
	messageDeduplicationId: string;
}

function extractRegionFromQueueUrl(queueUrl: string): string {
	const match = queueUrl.match(/sqs\.([a-z0-9-]+)\.amazonaws/);
	return match?.[1] ?? env.providers.aws.config.region ?? "us-east-1";
}

function createSQSClient(region: string): SQSClient {
	const hasExplicitCreds =
		!!env.providers.aws.config.accessKeyId &&
		!!env.providers.aws.config.secretAccessKey;
	return new SQSClient({
		region,
		...(hasExplicitCreds && {
			credentials: {
				accessKeyId: env.providers.aws.config.accessKeyId!,
				secretAccessKey: env.providers.aws.config.secretAccessKey!,
			},
		}),
	});
}

export class SQSProvider {
	private sqsClient: SQSClient;

	constructor() {
		const voteQueueUrl = env.providers.aws.sqs.voteQueueUrl;
		const region = extractRegionFromQueueUrl(voteQueueUrl);
		this.sqsClient = createSQSClient(region);
	}

	public async sendMessage(options: SQSSendMessageOptions): Promise<{
		success: boolean;
		messageId?: string;
		error?: string;
	}> {
		try {
			const params: SendMessageCommandInput = {
				QueueUrl: options.queueUrl,
				MessageBody: options.messageBody,
				MessageGroupId: options.messageGroupId,
				MessageDeduplicationId: options.messageDeduplicationId,
			};

			const command = new SendMessageCommand(params);
			const response = await this.sqsClient.send(command);

			return {
				success: true,
				messageId: response.MessageId,
			};
		} catch (error) {
			console.error("Erro ao enviar mensagem para SQS:", error);
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Erro desconhecido ao enviar mensagem para SQS",
			};
		}
	}
}
