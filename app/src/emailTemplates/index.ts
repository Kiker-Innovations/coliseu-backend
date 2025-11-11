export { TemplateEngine } from "./templateEngine";

export interface ResidentConfirmationTemplateData {
	residentName: string;
	apartmentNumber: string;
	confirmationCode: string;
	email: string;
	confirmationUrl: string;
}

export interface AdminConfirmationTemplateData {
	adminName: string;
	confirmationCode: string;
	email: string;
	confirmationUrl: string;
}

export interface ConciergeConfirmationTemplateData {
	conciergeName: string;
	shift: string;
	confirmationCode: string;
	email: string;
	confirmationUrl: string;
}

export interface ResidentWelcomeTemplateData {
	residentName: string;
	apartmentNumber: string;
	email: string;
	loginUrl: string;
}

export interface PasswordResetTemplateData {
	userName: string;
	email: string;
	resetCode: string;
	resetUrl?: string;
}

export const EmailTemplates = {
	RESIDENT_CONFIRMATION: "residentConfirmation",
	ADMIN_CONFIRMATION: "adminConfirmation",
	CONCIERGE_CONFIRMATION: "conciergeConfirmation",
	PASSWORD_RESET: "passwordReset",
} as const;
