import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import Fastify from 'fastify';


// Configure sua região
export const sqsClient = new SQSClient({ region: "us-east-1" });
export const QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/913173953684/queue-ai-manage";