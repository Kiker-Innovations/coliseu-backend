import {
	SESClient,
	SendEmailCommand,
	SendRawEmailCommand,
	type SendEmailCommandInput,
	type SendRawEmailCommandInput,
} from "@aws-sdk/client-ses";
import { env } from "../../config/env";
import type { FromEmailEnumType } from "../../v1/enum/fromEmail.enum";

export interface EmailAttachment {
	filename: string;
	content: Buffer | string;
	contentType?: string;
}

export interface SendEmailOptions {
	from: FromEmailEnumType;
	to: string | string[];
	subject: string;
	html: string;
	text?: string;
	attachments?: EmailAttachment[];
	replyTo?: string;
	cc?: string | string[];
	bcc?: string | string[];
	configurationSetName?: string;
}

export class SESProvider {
	private sesClient: SESClient;
	private defaultFromEmail: string;

	constructor() {
		this.defaultFromEmail = env.providers.aws.ses.fromEmail;

		this.sesClient = new SESClient({
			region: env.providers.aws.config.region,
			...(env.providers.aws.config.accessKeyId &&
				env.providers.aws.config.secretAccessKey && {
					credentials: {
						accessKeyId: env.providers.aws.config.accessKeyId,
						secretAccessKey: env.providers.aws.config.secretAccessKey,
					},
				}),
		});
	}

	public async sendEmail(options: SendEmailOptions): Promise<{
		success: boolean;
		messageId?: string;
		error?: string;
	}> {
		try {
			const toAddresses = Array.isArray(options.to)
				? options.to
				: [options.to];

			if (options.attachments && options.attachments.length > 0) {
				return await this.sendRawEmail(options);
			}

			const params: SendEmailCommandInput = {
				Source: options.from,
				Destination: {
					ToAddresses: toAddresses,
					...(options.cc && {
						CcAddresses: Array.isArray(options.cc)
							? options.cc
							: [options.cc],
					}),
					...(options.bcc && {
						BccAddresses: Array.isArray(options.bcc)
							? options.bcc
							: [options.bcc],
					}),
				},
				Message: {
					Subject: {
						Data: options.subject,
						Charset: "UTF-8",
					},
					Body: {
						Html: {
							Data: options.html,
							Charset: "UTF-8",
						},
						...(options.text && {
							Text: {
								Data: options.text,
								Charset: "UTF-8",
							},
						}),
					},
				},
				...(options.replyTo && {
					ReplyToAddresses: [options.replyTo],
				}),
				...(options.configurationSetName && {
					ConfigurationSetName: options.configurationSetName,
				}),
			};

			const command = new SendEmailCommand(params);
			const response = await this.sesClient.send(command);

			return {
				success: true,
				messageId: response.MessageId,
			};
		} catch (error) {
			console.error("Erro ao enviar email via SES:", error);
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Erro desconhecido ao enviar email",
			};
		}
	}

	private async sendRawEmail(options: SendEmailOptions): Promise<{
		success: boolean;
		messageId?: string;
		error?: string;
	}> {
		try {
			const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;
			const toAddresses = Array.isArray(options.to)
				? options.to
				: [options.to];

			let rawMessage = this.buildRawMessageHeaders({
				from: options.from,
				to: toAddresses,
				subject: options.subject,
				cc: options.cc,
				bcc: options.bcc,
				replyTo: options.replyTo,
				boundary,
			});

			rawMessage += `--${boundary}\r\n`;
			rawMessage += "Content-Type: multipart/alternative; ";
			rawMessage += `boundary="alt_${boundary}"\r\n\r\n`;

			if (options.text) {
				rawMessage += `--alt_${boundary}\r\n`;
				rawMessage += "Content-Type: text/plain; charset=UTF-8\r\n";
				rawMessage += "Content-Transfer-Encoding: quoted-printable\r\n\r\n";
				rawMessage += `${options.text}\r\n\r\n`;
			}

			rawMessage += `--alt_${boundary}\r\n`;
			rawMessage += "Content-Type: text/html; charset=UTF-8\r\n";
			rawMessage += "Content-Transfer-Encoding: quoted-printable\r\n\r\n";
			rawMessage += `${options.html}\r\n\r\n`;

			rawMessage += `--alt_${boundary}--\r\n\r\n`;

			if (options.attachments) {
				for (const attachment of options.attachments) {
					const content =
						typeof attachment.content === "string"
							? Buffer.from(attachment.content)
							: attachment.content;

					rawMessage += `--${boundary}\r\n`;
					rawMessage += `Content-Type: ${attachment.contentType || "application/octet-stream"}; name="${attachment.filename}"\r\n`;
					rawMessage += "Content-Transfer-Encoding: base64\r\n";
					rawMessage += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n\r\n`;
					rawMessage += `${content.toString("base64")}\r\n\r\n`;
				}
			}

			rawMessage += `--${boundary}--\r\n`;

			const params: SendRawEmailCommandInput = {
				RawMessage: {
					Data: Buffer.from(rawMessage),
				},
				...(options.configurationSetName && {
					ConfigurationSetName: options.configurationSetName,
				}),
			};

			const command = new SendRawEmailCommand(params);
			const response = await this.sesClient.send(command);

			return {
				success: true,
				messageId: response.MessageId,
			};
		} catch (error) {
			console.error("Erro ao enviar email raw via SES:", error);
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Erro desconhecido ao enviar email raw",
			};
		}
	}

	private buildRawMessageHeaders(params: {
		from: string;
		to: string[];
		subject: string;
		cc?: string | string[];
		bcc?: string | string[];
		replyTo?: string;
		boundary: string;
	}): string {
		let headers = "";

		headers += `From: ${params.from}\r\n`;
		headers += `To: ${params.to.join(", ")}\r\n`;

		if (params.cc) {
			const ccAddresses = Array.isArray(params.cc)
				? params.cc.join(", ")
				: params.cc;
			headers += `Cc: ${ccAddresses}\r\n`;
		}

		if (params.bcc) {
			const bccAddresses = Array.isArray(params.bcc)
				? params.bcc.join(", ")
				: params.bcc;
			headers += `Bcc: ${bccAddresses}\r\n`;
		}

		if (params.replyTo) {
			headers += `Reply-To: ${params.replyTo}\r\n`;
		}

		headers += `Subject: =?UTF-8?B?${Buffer.from(params.subject).toString("base64")}?=\r\n`;
		headers += "MIME-Version: 1.0\r\n";
		headers += `Content-Type: multipart/mixed; boundary="${params.boundary}"\r\n\r\n`;

		return headers;
	}

	public async sendBulkEmails(emails: SendEmailOptions[]): Promise<{
		success: boolean;
		results: Array<{ success: boolean; messageId?: string; error?: string }>;
	}> {
		const results = await Promise.all(
			emails.map((email) => this.sendEmail(email)),
		);

		const allSuccess = results.every((result) => result.success);

		return {
			success: allSuccess,
			results,
		};
	}

	public getDefaultFromEmail(): string {
		return this.defaultFromEmail;
	}
}

