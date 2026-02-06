import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import { httpException } from "../../../config/error";
import type { JwtPayload } from "../../../interface/jwtPayload.interface";
import type { UserTypeEnumType } from "../../enum/userType.enum";
import { AuthService } from "./auth.service";

declare module "fastify" {
	interface FastifyRequest {
		user?: JwtPayload;
	}
}

export class AuthMiddleware {
	private authService: AuthService;

	constructor(mongoClient: MongoClient) {
		this.authService = new AuthService(mongoClient);
	}

	public authenticate = async (
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> => {
		try {
			const authHeader = request.headers.authorization;
			if (!authHeader) {
				throw httpException(
					"Token de autenticação não fornecido",
					httpStatus.UNAUTHORIZED,
				);
			}

			const parts = authHeader.split(" ");

			if (parts.length !== 2 || parts[0] !== "Bearer") {			
	
				throw httpException(
					"Formato de token inválido. Use: Bearer {token}",
					httpStatus.UNAUTHORIZED,
				);
			}

			const token = parts[1];
			const decoded = await this.authService.verifyToken(token);
			
			request.user = decoded;
		} catch (error) {
			throw error;
		}
	};

	public authorize =
		(allowedUserTypes: UserTypeEnumType[]) =>
		async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
			if (!request.user) {
				throw httpException("Usuário não autenticado", httpStatus.UNAUTHORIZED);
			}

			if (!allowedUserTypes.includes(request.user.userType)) {
				throw httpException(
					"Você não tem permissão para acessar este recurso",
					httpStatus.FORBIDDEN,
				);
			}
		};

	public checkPermission =
		(tag: string, action: "read" | "create" | "update" | "delete") =>
		async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
			if (!request.user) {
				return reply.status(httpStatus.UNAUTHORIZED).send({
					success: false,
					message: "Usuário não autenticado",
				});
			}

			if (!request.user.permissions) {
				return reply.status(httpStatus.FORBIDDEN).send({
					success: false,
					message: "Permissões não encontradas no token",
				});
			}

			const pagePermissions = request.user.permissions[tag];

			if (!pagePermissions) {
				return reply.status(httpStatus.FORBIDDEN).send({
					success: false,
					message: "Você não tem permissão para acessar esta página",
				});
			}

			if (!pagePermissions[action]) {
				return reply.status(httpStatus.FORBIDDEN).send({
					success: false,
					message: `Você não tem permissão para ${action} nesta página`,
				});
			}
		};
}
