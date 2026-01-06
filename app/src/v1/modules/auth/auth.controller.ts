import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import {
	transformLoginAdminDto,
	transformLoginConciergeDto,
	transformLoginResidentDto,
	transformRefreshTokenDto,
} from "./dto";
import { AuthService } from "./auth.service";

export class AuthController {
	private authService: AuthService;

	constructor(mongoClient: MongoClient) {
		this.authService = new AuthService(mongoClient);
	}

	public async loginResident(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		return reply
			.code(httpStatus.OK)
			.send(
				await this.authService.loginResident(
					transformLoginResidentDto(request.body),
				),
			);
	}

	public async loginConcierge(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		return reply
			.code(httpStatus.OK)
			.send(
				await this.authService.loginConcierge(
					transformLoginConciergeDto(request.body),
				),
			);
	}

	public async loginAdmin(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		return reply
			.code(httpStatus.OK)
			.send(
				await this.authService.loginAdmin(transformLoginAdminDto(request.body)),
			);
	}

	public async validateResident(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const authHeader = request.headers.authorization;
		const token = authHeader?.split(" ")[1] || "";
		return reply
			.code(httpStatus.OK)
			.send(await this.authService.validateResident(token));
	}

	public async validateConcierge(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const authHeader = request.headers.authorization;
		const token = authHeader?.split(" ")[1] || "";
		return reply
			.code(httpStatus.OK)
			.send(await this.authService.validateConcierge(token));
	}

	public async validateAdmin(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const authHeader = request.headers.authorization;
		const token = authHeader?.split(" ")[1] || "";
		return reply
			.code(httpStatus.OK)
			.send(await this.authService.validateAdmin(token));
	}

	public async refresh(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		return reply
			.code(httpStatus.OK)
			.send(
				await this.authService.refreshToken(
					transformRefreshTokenDto(request.body).refreshToken,
				),
			);
	}
}
