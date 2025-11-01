import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { AuthController } from "./auth.controller";
import { AuthSchema } from "./auth.schema";

export class AuthRouteV1 {
	private authController: AuthController;
	private authSchema: AuthSchema;

	constructor(mongoClient: MongoClient) {
		this.authController = new AuthController(mongoClient);
		this.authSchema = new AuthSchema();
	}

	private loginResident = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/auth/login/resident",
			schema: {
				tags: ["Auth"],
				summary: "Login resident",
				description: "Autentica um morador com apartamento, email e senha",
				...this.authSchema.loginResident,
			},
			handler: this.authController.loginResident.bind(
				this.authController,
			) as RouteHandlerMethod,
		};
	};

	private loginConcierge = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/auth/login/concierge",
			schema: {
				tags: ["Auth"],
				summary: "Login concierge",
				description: "Autentica um porteiro com email e senha",
				...this.authSchema.loginConcierge,
			},
			handler: this.authController.loginConcierge.bind(
				this.authController,
			) as RouteHandlerMethod,
		};
	};

	private loginAdmin = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/auth/login/admin",
			schema: {
				tags: ["Auth"],
				summary: "Login admin",
				description: "Autentica um administrador com email e senha",
				...this.authSchema.loginAdmin,
			},
			handler: this.authController.loginAdmin.bind(
				this.authController,
			) as RouteHandlerMethod,
		};
	};

	private validateResident = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/auth/validate/resident",
			schema: {
				tags: ["Auth"],
				summary: "Validate resident token",
				description:
					"Valida o token de autenticação de um morador e retorna seus dados",
				...this.authSchema.validateResident,
			},
			handler: this.authController.validateResident.bind(
				this.authController,
			) as RouteHandlerMethod,
		};
	};

	private validateConcierge = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/auth/validate/concierge",
			schema: {
				tags: ["Auth"],
				summary: "Validate concierge token",
				description:
					"Valida o token de autenticação de um porteiro e retorna seus dados",
				...this.authSchema.validateConcierge,
			},
			handler: this.authController.validateConcierge.bind(
				this.authController,
			) as RouteHandlerMethod,
		};
	};

	private validateAdmin = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/auth/validate/admin",
			schema: {
				tags: ["Auth"],
				summary: "Validate admin token",
				description:
					"Valida o token de autenticação de um administrador e retorna seus dados",
				...this.authSchema.validateAdmin,
			},
			handler: this.authController.validateAdmin.bind(
				this.authController,
			) as RouteHandlerMethod,
		};
	};

	private refresh = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/auth/refresh",
			schema: {
				tags: ["Auth"],
				summary: "Refresh token",
				description: "Renova o access token usando o refresh token",
				...this.authSchema.refreshToken,
			},
			handler: this.authController.refresh.bind(
				this.authController,
			) as RouteHandlerMethod,
		};
	};

	public routes = (): RouteOptions[] => {
		return [
			this.loginResident(),
			this.loginConcierge(),
			this.loginAdmin(),
			this.validateResident(),
			this.validateConcierge(),
			this.validateAdmin(),
			this.refresh(),
		];
	};
}

