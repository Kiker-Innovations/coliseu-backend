import { EmailProvider } from "@/providers/resend/email.provider";
import { TemplateEngine, EmailTemplates } from "@/emailTemplates";
import { FromEmailEnum } from "@/v1/enum/fromEmail.enum";

export class NoticeEmail {
	emailProvider: EmailProvider;

	constructor() {
		this.emailProvider = new EmailProvider();
	}

	async sendNoticeNotificationEmail(
		email: string,
		residentName: string,
		buildingName: string,
		noticeTitle: string,
		noticeContent: string,
		noticeUrl: string,
		hasAttachment: boolean,
	): Promise<{ success: boolean; messageId?: string; error?: string }> {
		const htmlContent = TemplateEngine.render(
			EmailTemplates.NOTICE_NOTIFICATION,
			{
				residentName,
				buildingName,
				noticeTitle,
				noticeContent,
				noticeUrl,
				hasAttachment,
			},
		);

		const emailOptions: any = {
			from: FromEmailEnum.NOREPLY,
			to: email,
			subject: `Novo Aviso - ${noticeTitle}`,
			html: htmlContent,
			text: `Olá ${residentName}! Um novo aviso foi publicado: ${noticeTitle}. Acesse o aplicativo para ver mais detalhes: ${noticeUrl}`,
		};

		const result = await this.emailProvider.sendEmail(emailOptions);
		// Aguarda 500ms antes de retornar (delay após envio)
		await new Promise((resolve) => setTimeout(resolve, 500));
		return result;
	}

	async sendNoticeNotificationEmailAsync(
		email: string,
		residentName: string,
		buildingName: string,
		noticeTitle: string,
		noticeContent: string,
		noticeUrl: string,
		hasAttachment: boolean,
	): Promise<void> {
		try {
			const result = await this.sendNoticeNotificationEmail(
				email,
				residentName,
				buildingName,
				noticeTitle,
				noticeContent,
				noticeUrl,
				hasAttachment,
			);
			if (result.success) {
				console.log(`✅ Email de aviso enviado para ${email}`);
				console.log(`📧 Message ID: ${result.messageId}`);
			} else {
				console.error(
					`❌ Erro ao enviar email de aviso para ${email}:`,
					result.error,
				);
			}
		} catch (error) {
			console.error(
				`❌ Erro inesperado ao enviar email de aviso para ${email}:`,
				error,
			);
		}
	}
}
