export const FromEmailEnum = {
	NOREPLY: "Coliseu <onboarding@resend.dev>",
	HELP: "help@coliseucondo.com.br",
	CONTACT: "contact@coliseucondo.com.br",
} as const;

export type FromEmailEnumType =
	(typeof FromEmailEnum)[keyof typeof FromEmailEnum];
