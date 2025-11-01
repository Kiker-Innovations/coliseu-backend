import { SESProvider } from "@/providers/aws/ses.provider";
const sesProvider = new SESProvider();

export async function sendConfirmationEmail(
    email: string,
    code: string,
): Promise<string> {
    return await sesProvider.sendConfirmationEmail(email, code);
}

export async function sendConfirmationEmailAsync(
    email: string,
    code: string,
): Promise<void> {
    try {
        await sendConfirmationEmail(email, code);
        console.log(`Email de confirmação enviado para ${email}`);
    } catch (error) {
        console.error(`Erro ao enviar email de confirmação para ${email}:`, error);
    }
}

export async function sendPasswordResetEmail(
    email: string,
    resetToken: string,
): Promise<string> {
    return await sesProvider.sendPasswordResetEmail(email, resetToken);
}

export async function sendPasswordResetEmailAsync(
    email: string,
    resetToken: string,
): Promise<void> {
    try {
        await sendPasswordResetEmail(email, resetToken);
        console.log(`Email de reset de senha enviado para ${email}`);
    } catch (error) {
        console.error(`Erro ao enviar email de reset de senha para ${email}:`, error);
    }
}