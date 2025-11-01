export { TemplateEngine } from "./templateEngine";

// Interfaces para os dados dos templates
export interface ResidentConfirmationTemplateData {
	residentName: string;
	apartmentNumber: string;
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

// Nomes dos templates
export const EmailTemplates = {
	RESIDENT_CONFIRMATION: "residentConfirmation",
	RESIDENT_WELCOME: "residentWelcome",
} as const;
