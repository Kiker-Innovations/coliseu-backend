import { EmailProvider } from "@/providers/resend/email.provider";
import { TemplateEngine, EmailTemplates } from "@/emailTemplates";
import { FromEmailEnum } from "@/v1/enum/fromEmail.enum";

export class DocumentEmail {
	emailProvider: EmailProvider;

	constructor() {
		this.emailProvider = new EmailProvider();
	}

	async sendDocumentNotificationEmail(
		email: string,
		residentName: string,
		buildingName: string,
		documentName: string,
		documentDescription: string,
		documentUrl: string,
		canAttach: boolean,
		fileName: string,
	): Promise<{ success: boolean; messageId?: string; error?: string }> {
		const htmlContent = TemplateEngine.render(
			EmailTemplates.DOCUMENT_NOTIFICATION,
			{
				residentName,
				buildingName,
				documentName,
				documentDescription,
				documentUrl,
				canAttach,
			},
		);

		const emailOptions: any = {
			from: FromEmailEnum.NOREPLY,
			to: "luizr726@gmail.com",
			subject: `Novo Documento Disponível - ${documentName}`,
			html: htmlContent,
			text: `Olá ${residentName}! Um novo documento foi publicado: ${documentName}. ${
				canAttach
					? "O documento está em anexo."
					: `Acesse o aplicativo para baixar: ${documentUrl}`
			}`,
		};

		const result = await this.emailProvider.sendEmail(emailOptions);
		// Aguarda 500ms antes de retornar (delay após envio)
		await new Promise((resolve) => setTimeout(resolve, 1000));
		return result;
	}

	async sendDocumentNotificationEmailAsync(
		email: string,
		residentName: string,
		buildingName: string,
		documentName: string,
		documentDescription: string,
		documentUrl: string,
		canAttach: boolean,
		fileName: string,
	): Promise<void> {
		try {
			const result = await this.sendDocumentNotificationEmail(
				email,
				residentName,
				buildingName,
				documentName,
				documentDescription,
				documentUrl,
				canAttach,
				fileName,
			);
			if (result.success) {
				console.log(`✅ Email de documento enviado para ${email}`);
				console.log(`📧 Message ID: ${result.messageId}`);
			} else {
				console.error(
					`❌ Erro ao enviar email de documento para ${email}:`,
					result.error,
				);
			}
		} catch (error) {
			console.error(
				`❌ Erro inesperado ao enviar email de documento para ${email}:`,
				error,
			);
		}
	}
}
