export { TemplateEngine } from "./templateEngine";

export interface ResidentConfirmationTemplateData {
	residentName: string;
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

export interface PackageArrivalTemplateData {
	residentName: string;
	buildingName: string;
	apartmentNumber: string;
	arrivalDate: string;
	description?: string;
}

export const EmailTemplates = {
	RESIDENT_CONFIRMATION: "residentConfirmation",
	ADMIN_CONFIRMATION: "adminConfirmation",
	CONCIERGE_CONFIRMATION: "conciergeConfirmation",
	PASSWORD_RESET: "passwordReset",
	PACKAGE_ARRIVAL: "packageArrival",
} as const;
