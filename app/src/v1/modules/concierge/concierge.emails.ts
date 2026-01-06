import { EmailProvider } from "@/providers/resend/email.provider";
import { TemplateEngine, EmailTemplates } from "@/emailTemplates";
import { FromEmailEnum } from "@/v1/enum/fromEmail.enum";

export class ConciergeEmail {
	emailProvider: EmailProvider;

	constructor() {
		this.emailProvider = new EmailProvider();
	}

	async sendConfirmationEmail(
		email: string,
		conciergeName: string,
		shift: string,
		confirmationCode: string,
	): Promise<{ success: boolean; messageId?: string; error?: string }> {
		const htmlContent = TemplateEngine.render(
			EmailTemplates.CONCIERGE_CONFIRMATION,
			{
				conciergeName,
				shift,
				confirmationCode,
				email,
				confirmationUrl: "https://coliseucondo.com.br/concierge/confirmcode",
			},
		);

		return await this.emailProvider.sendEmail({
			from: FromEmailEnum.NOREPLY,
			to: email,
			subject: "Confirme seu Cadastro de Porteiro - Coliseu",
			html: htmlContent,
			text: `Olá ${conciergeName}! Seu código de confirmação é: ${confirmationCode}. Acesse: https://coliseucondo.com.br/concierge/confirmcode`,
		});
	}

	async sendConfirmationEmailAsync(
		email: string,
		conciergeName: string,
		shift: string,
		confirmationCode: string,
	): Promise<void> {
		try {
			const result = await this.sendConfirmationEmail(
				email,
				conciergeName,
				shift,
				confirmationCode,
			);
			if (result.success) {
				console.log(`✅ Email de confirmação enviado para ${email}`);
				console.log(`📧 Message ID: ${result.messageId}`);
			} else {
				console.error(
					`❌ Erro ao enviar email de confirmação para ${email}:`,
					result.error,
				);
			}
		} catch (error) {
			console.error(
				`❌ Erro inesperado ao enviar email de confirmação para ${email}:`,
				error,
			);
		}
	}
}
