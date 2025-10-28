import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";
import { env } from "../../config/env";

/**
 * Provider para envio de emails usando AWS SES
 *
 * IMPORTANTE - Configurações necessárias no AWS SES:
 * 1. Email de origem (fromEmail) deve estar verificado no SES
 * 2. Se em Sandbox, emails de destino também devem estar verificados
 * 3. Para produção, solicitar saída do Sandbox mode
 * 4. Configurar rate limits e bounce/complaint notifications
 *
 * SEGURANÇA:
 * - Implementar rate limiting no application layer para prevenir abuso
 * - Validar todos os endereços de email antes de enviar
 * - Monitorar bounce e complaint rates
 */
export class SESProvider {
	private sesClient: SESClient;
	private fromEmail: string;

	constructor() {
		this.fromEmail = env.providers.aws.ses.fromEmail;

		this.sesClient = new SESClient({
			region: env.providers.aws.config.region,
			credentials: {
				accessKeyId: env.providers.aws.config.accessKeyId,
				secretAccessKey: env.providers.aws.config.secretAccessKey,
			},
		});
	}

	/**
	 * Envia um email usando AWS SES
	 *
	 * @param {string} toEmail - Email do destinatário
	 * @param {string} subject - Assunto do email
	 * @param {string} htmlBody - Corpo do email em HTML
	 * @param {string} textBody - Corpo do email em texto puro (fallback)
	 * @returns {Promise<string>} MessageId do email enviado
	 * @throws {Error} Se houver erro ao enviar o email
	 */
	public async sendEmail(
		toEmail: string,
		subject: string,
		htmlBody: string,
		textBody: string,
	): Promise<string> {
		const command = new SendEmailCommand({
			Source: this.fromEmail,
			Destination: {
				ToAddresses: [toEmail],
			},
			Message: {
				Subject: {
					Data: subject,
					Charset: "UTF-8",
				},
				Body: {
					Html: {
						Data: htmlBody,
						Charset: "UTF-8",
					},
					Text: {
						Data: textBody,
						Charset: "UTF-8",
					},
				},
			},
		});

		try {
			const response = await this.sesClient.send(command);
			return response.MessageId || "unknown";
		} catch (error) {
			console.error("Erro ao enviar email via SES:", error);
			throw new Error("Falha ao enviar email de confirmação");
		}
	}

	/**
	 * Envia email de confirmação de cadastro para morador
	 *
	 * @param {string} toEmail - Email do morador
	 * @param {string} residentCode - Código de confirmação do morador
	 * @returns {Promise<string>} MessageId do email enviado
	 */
	public async sendConfirmationEmail(
		toEmail: string,
		residentCode: string,
	): Promise<string> {
		const confirmationLink = `${env.app.baseUrl}/confirm/${encodeURIComponent(toEmail)}/${residentCode}`;

		const subject = "Confirme seu cadastro no Coliseu";

		const htmlBody = `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="UTF-8">
				<title>Confirme seu cadastro</title>
			</head>
			<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
				<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
					<h1 style="color: #2c3e50;">Bem-vindo ao Coliseu!</h1>
					<p>Olá,</p>
					<p>Obrigado por se cadastrar no Coliseu, o sistema de gestão do seu condomínio.</p>
					<p>Para ativar sua conta, clique no link abaixo:</p>
					<div style="text-align: center; margin: 30px 0;">
						<a href="${confirmationLink}" 
						   style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
							Confirmar Cadastro
						</a>
					</div>
					<p>Ou copie e cole o seguinte link no seu navegador:</p>
					<p style="word-break: break-all; color: #7f8c8d;">${confirmationLink}</p>
					<p><strong>Seu código de confirmação:</strong> <code style="background-color: #ecf0f1; padding: 5px 10px; border-radius: 3px;">${residentCode}</code></p>
					<hr style="border: none; border-top: 1px solid #ecf0f1; margin: 30px 0;">
					<p style="font-size: 12px; color: #7f8c8d;">
						Se você não solicitou este cadastro, por favor ignore este email.
					</p>
				</div>
			</body>
			</html>
		`;

		const textBody = `
Bem-vindo ao Coliseu!

Olá,

Obrigado por se cadastrar no Coliseu, o sistema de gestão do seu condomínio.

Para ativar sua conta, acesse o seguinte link:
${confirmationLink}

Seu código de confirmação: ${residentCode}

Se você não solicitou este cadastro, por favor ignore este email.
		`;

		return await this.sendEmail(toEmail, subject, htmlBody, textBody);
	}
}
