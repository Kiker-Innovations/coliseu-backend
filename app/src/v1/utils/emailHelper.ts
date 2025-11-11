import { EmailProvider } from "@/providers/resend/email.provider";
import { TemplateEngine, EmailTemplates } from "@/emailTemplates";
import { FromEmailEnum } from "@/v1/enum/fromEmail.enum";

const emailProvider = new EmailProvider();

export async function sendPasswordResetEmail(
	email: string,
	userName: string,
	resetCode: string,
	resetUrl: string,
): Promise<void> {
	try {
		const htmlContent = TemplateEngine.render(EmailTemplates.PASSWORD_RESET, {
			userName,
			email,
			resetCode,
			resetUrl,
		});

		const result = await emailProvider.sendEmail({
			from: FromEmailEnum.NOREPLY,
			to: email,
			subject: "Recuperação de Senha - Coliseu",
			html: htmlContent,
			text: `Olá ${userName}! Seu código de recuperação de senha é: ${resetCode}. Este código expira em 15 minutos.`,
		});

		if (result.success) {
			console.log(`✅ Email de recuperação de senha enviado para ${email}`);
			console.log(`📧 Message ID: ${result.messageId}`);
		} else {
			console.error(
				`❌ Erro ao enviar email de recuperação de senha para ${email}:`,
				result.error,
			);
		}
	} catch (error) {
		console.error(
			`❌ Erro inesperado ao enviar email de recuperação de senha para ${email}:`,
			error,
		);
	}
}