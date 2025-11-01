import { EmailProvider } from "@/providers/resend/email.provider";
import { TemplateEngine, EmailTemplates } from "@/emailTemplates";
import { FromEmailEnum } from "@/v1/enum/fromEmail.enum";
import { env } from "@/config/env";

const emailProvider = new EmailProvider();

export async function sendConfirmationEmail(
	email: string,
	code: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
	const htmlContent = TemplateEngine.render(
		EmailTemplates.RESIDENT_CONFIRMATION,
		{
			residentName: "Usuário",
			apartmentNumber: "N/A",
			confirmationCode: code,
			email,
			confirmationUrl: "https://coliseucondo.com.br/confirm",
		},
	);

	return await emailProvider.sendEmail({
		from: FromEmailEnum.NOREPLY,
		to: email,
		subject: "Confirme seu Cadastro - Coliseu Condo",
		html: htmlContent,
		text: `Seu código de confirmação é: ${code}`,
	});
}

export async function sendConfirmationEmailAsync(
	email: string,
	code: string,
): Promise<void> {
	try {
		const result = await sendConfirmationEmail(email, code);
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

export async function sendPasswordResetEmail(
	email: string,
	userName: string,
	resetCode: string,
	resetUrl: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
	const htmlContent = TemplateEngine.render(EmailTemplates.PASSWORD_RESET, {
		userName,
		email,
		resetCode,
		resetUrl,
	});

	return await emailProvider.sendEmail({
		from: FromEmailEnum.NOREPLY,
		to: email,
		subject: "Recuperação de Senha - Coliseu Condo",
		html: htmlContent,
		text: `Olá ${userName}! Seu código de recuperação de senha é: ${resetCode}. Este código expira em 15 minutos.`,
	});
}

export async function sendPasswordResetEmailAsync(
	email: string,
	userName: string,
	resetCode: string,
	resetUrl: string,
): Promise<void> {
	try {
		const result = await sendPasswordResetEmail(
			email,
			userName,
			resetCode,
			resetUrl,
		);
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

export async function sendResidentConfirmationEmail(
	email: string,
	residentName: string,
	apartmentNumber: string,
	confirmationCode: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
	const htmlContent = TemplateEngine.render(
		EmailTemplates.RESIDENT_CONFIRMATION,
		{
			residentName,
			apartmentNumber,
			confirmationCode,
			email,
			confirmationUrl: "https://coliseucondo.com.br/resident/confirmcode",
		},
	);

	return await emailProvider.sendEmail({
		from: FromEmailEnum.NOREPLY,
		to: email,
		subject: "Confirme seu Cadastro - Coliseu Condo",
		html: htmlContent,
		text: `Olá ${residentName}! Seu código de confirmação é: ${confirmationCode}. Acesse: https://coliseucondo.com.br/resident/confirmcode`,
	});
}

export async function sendResidentConfirmationEmailAsync(
	email: string,
	residentName: string,
	apartmentNumber: string,
	confirmationCode: string,
): Promise<void> {
	try {
		const result = await sendResidentConfirmationEmail(
			email,
			residentName,
			apartmentNumber,
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

export async function sendResidentWelcomeEmail(
	email: string,
	residentName: string,
	apartmentNumber: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
	const htmlContent = TemplateEngine.render(EmailTemplates.RESIDENT_WELCOME, {
		residentName,
		apartmentNumber,
		email,
		loginUrl: `${env.app.baseUrl}/login`,
	});

	return await emailProvider.sendEmail({
		from: FromEmailEnum.NOREPLY,
		to: email,
		subject: "Bem-vindo ao Coliseu Condo - Cadastro Aprovado! 🎉",
		html: htmlContent,
		text: `Parabéns ${residentName}! Seu cadastro foi aprovado no Coliseu Condo.`,
	});
}

export async function sendResidentWelcomeEmailAsync(
	email: string,
	residentName: string,
	apartmentNumber: string,
): Promise<void> {
	try {
		const result = await sendResidentWelcomeEmail(
			email,
			residentName,
			apartmentNumber,
		);
		if (result.success) {
			console.log(`✅ Email de boas-vindas enviado para ${email}`);
			console.log(`📧 Message ID: ${result.messageId}`);
		} else {
			console.error(
				`❌ Erro ao enviar email de boas-vindas para ${email}:`,
				result.error,
			);
		}
	} catch (error) {
		console.error(
			`❌ Erro inesperado ao enviar email de boas-vindas para ${email}:`,
			error,
		);
	}
}