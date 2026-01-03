import { Resend } from "resend";
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
}

export class EmailProvider {
	private resend: Resend;

	constructor() {
		this.resend = new Resend(env.providers.resend.apiKey);
	}

	public async sendEmail(options: SendEmailOptions): Promise<{
		success: boolean;
		messageId?: string;
		error?: string;
	}> {
		try {
			const { data, error } = await this.resend.emails.send({
				from: options.from,
				to: Array.isArray(options.to) ? options.to : [options.to],
				subject: options.subject,
				html: options.html,
				text: options.text,
				attachments: options.attachments?.map((att) => ({
					filename: att.filename,
					content: att.content,
					...(att.contentType && { content_type: att.contentType }),
				})),
				...(options.replyTo && { reply_to: options.replyTo }),
				...(options.cc && {
					cc: Array.isArray(options.cc) ? options.cc : [options.cc],
				}),
				...(options.bcc && {
					bcc: Array.isArray(options.bcc) ? options.bcc : [options.bcc],
				}),
			});

			if (error) {
				console.error("Erro ao enviar email:", error);
				return {
					success: false,
					error: error.message,
				};
			}

			return {
				success: true,
				messageId: data?.id,
			};
		} catch (error) {
			console.error("Erro inesperado ao enviar email:", error);
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Erro desconhecido ao enviar email",
			};
		}
	}

	public async sendBulkEmails(
		emails: SendEmailOptions[],
	): Promise<{
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
}

