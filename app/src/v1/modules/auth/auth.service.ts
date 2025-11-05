import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import type { MongoClient } from "mongodb";
import { env } from "../../../config/env";
import { httpException } from "../../../config/error";
import { AdminRepository } from "../../../database/mongodb/repositories/admin.repository";
import { ConciergeRepository } from "../../../database/mongodb/repositories/concierge.repository";
import { ResidentRepository } from "../../../database/mongodb/repositories/resident.repository";
import type { HttpResponse } from "../../../interface/httpResponse.interface";
import type { JwtPayload } from "../../../interface/jwtPayload.interface";
import type { RefreshTokenPayload } from "../../../interface/refreshTokenPayload.interface";
import { ResidentStatusEnum } from "../../enum/residentStatus.enum";
import { UserTypeEnum } from "../../enum/userType.enum";
import type {
	LoginAdminDto,
	LoginConciergeDto,
	LoginResidentDto,
} from "./dto";
import { ConciergeStatusEnum } from "@/v1/enum/conciergeStatus.enum";
import { AdminStatusEnum } from "@/v1/enum/adminStatus.enum";

export class AuthService {
	private residentRepository: ResidentRepository;
	private conciergeRepository: ConciergeRepository;
	private adminRepository: AdminRepository;

	constructor(mongoClient: MongoClient) {
		this.residentRepository = new ResidentRepository(mongoClient);
		this.conciergeRepository = new ConciergeRepository(mongoClient);
		this.adminRepository = new AdminRepository(mongoClient);
	}

	public async loginResident(
		loginResidentDto: LoginResidentDto,
	): Promise<HttpResponse<{ token: string; refreshToken: string }>> {
		const resident = await this.residentRepository.findByEmail(
			loginResidentDto.email,
		);

		if (!resident) {
			throw httpException(
				"Credenciais inválidas",
				httpStatus.UNAUTHORIZED,
			);
		}

		if (resident.apartmentNumber !== loginResidentDto.apartmentNumber) {
			throw httpException(
				"Credenciais inválidas",
				httpStatus.UNAUTHORIZED,
			);
		}

		if (resident.status === ResidentStatusEnum.INATIVO) {
			throw httpException(
				"Cadastro não confirmado. Verifique seu email.",
				httpStatus.FORBIDDEN,
			);
		}

		if (resident.status === ResidentStatusEnum.VALIDADO) {
			throw httpException(
				"Cadastro aguardando aprovação do administrador.",
				httpStatus.FORBIDDEN,
			);
		}

		const isPasswordValid = await this.comparePassword(
			loginResidentDto.password,
			resident.passwordHash,
		);

		if (!isPasswordValid) {
			throw httpException(
				"Credenciais inválidas",
				httpStatus.UNAUTHORIZED,
			);
		}

		const token = await this.generateToken({
			userId: resident._id,
			userType: UserTypeEnum.RESIDENT,
			email: resident.email,
		});

		const refreshToken = await this.generateRefreshToken({
			userId: resident._id,
			userType: UserTypeEnum.RESIDENT,
			tokenType: "refresh",
		});

		return {
			success: true,
			message: "Login realizado com sucesso",
			data: {
				token,
				refreshToken,
			},
		};
	}

	public async loginConcierge(
		loginConciergeDto: LoginConciergeDto,
	): Promise<HttpResponse<{ token: string; refreshToken: string }>> {
		const concierge = await this.conciergeRepository.findByEmail(
			loginConciergeDto.email,
		);

		if (!concierge) {
			throw httpException(
				"Credenciais inválidas",
				httpStatus.UNAUTHORIZED,
			);
		}

		if (concierge.status !== ConciergeStatusEnum.ATIVO) {
			throw httpException(
				"Usuário não está ativo.",
				httpStatus.FORBIDDEN,
			);
		}

		const isPasswordValid = await this.comparePassword(
			loginConciergeDto.password,
			concierge.passwordHash,
		);

		if (!isPasswordValid) {
			throw httpException(
				"Credenciais inválidas",
				httpStatus.UNAUTHORIZED,
			);
		}

		const token = await this.generateToken({
			userId: concierge._id,
			userType: UserTypeEnum.CONCIERGE,
			email: concierge.email,
		});

		const refreshToken = await this.generateRefreshToken({
			userId: concierge._id,
			userType: UserTypeEnum.CONCIERGE,
			tokenType: "refresh",
		});

		return {
			success: true,
			message: "Login realizado com sucesso",
			data: {
				token,
				refreshToken,
			},
		};
	}

	public async loginAdmin(
		loginAdminDto: LoginAdminDto,
	): Promise<HttpResponse<{ token: string; refreshToken: string }>> {
		const admin = await this.adminRepository.findByEmail(loginAdminDto.email);

		if (!admin) {
			throw httpException(
				"Credenciais inválidas",
				httpStatus.UNAUTHORIZED,
			);
		}

		if (admin.status !== AdminStatusEnum.ATIVO) {
			throw httpException(
				"Usuário inativo. Confirme seu email para ativar sua conta.",
				httpStatus.FORBIDDEN,
			);
		}

		const isPasswordValid = await this.comparePassword(
			loginAdminDto.password,
			admin.passwordHash,
		);

		if (!isPasswordValid) {
			throw httpException(
				"Credenciais inválidas",
				httpStatus.UNAUTHORIZED,
			);
		}

		const token = await this.generateToken({
			userId: admin._id,
			userType: UserTypeEnum.ADMIN,
			email: admin.email,
		});

		const refreshToken = await this.generateRefreshToken({
			userId: admin._id,
			userType: UserTypeEnum.ADMIN,
			tokenType: "refresh",
		});

		return {
			success: true,
			message: "Login realizado com sucesso",
			data: {
				token,
				refreshToken,
			},
		};
	}

	public async validateResident(
		token: string,
	): Promise<
		HttpResponse<{
			userId: string;
			email: string;
			apartmentNumber: string;
			phone: string;
		}>
	> {
		const decoded = await this.verifyToken(token);

		if (decoded.userType !== UserTypeEnum.RESIDENT) {
			throw httpException("Token inválido para este tipo de usuário", httpStatus.UNAUTHORIZED);
		}

		const resident = await this.residentRepository.findById(decoded.userId);

		if (!resident) {
			throw httpException("Usuário não encontrado", httpStatus.NOT_FOUND);
		}

		if (resident.status !== ResidentStatusEnum.ATIVO) {
			throw httpException("Usuário não está ativo", httpStatus.FORBIDDEN);
		}

		return {
			success: true,
			message: "Token válido",
			data: {
				userId: resident._id,
				email: resident.email,
				apartmentNumber: resident.apartmentNumber,
				phone: resident.phone,
			},
		};
	}

	public async validateConcierge(
		token: string,
	): Promise<
		HttpResponse<{
			userId: string;
			email: string;
			name: string;
			phone: string;
		}>
	> {
		const decoded = await this.verifyToken(token);

		if (decoded.userType !== UserTypeEnum.CONCIERGE) {
			throw httpException("Token inválido para este tipo de usuário", httpStatus.UNAUTHORIZED);
		}

		const concierge = await this.conciergeRepository.findById(decoded.userId);

		if (!concierge) {
			throw httpException("Usuário não encontrado", httpStatus.NOT_FOUND);
		}

		if (concierge.status !== ConciergeStatusEnum.ATIVO) {
			throw httpException("Usuário não está ativo", httpStatus.FORBIDDEN);
		}

		return {
			success: true,
			message: "Token válido",
			data: {
				userId: concierge._id,
				email: concierge.email,
				name: concierge.name,
				phone: concierge.phone,
			},
		};
	}

	public async validateAdmin(
		token: string,
	): Promise<
		HttpResponse<{
			userId: string;
			email: string;
			name: string;
		}>
	> {
		const decoded = await this.verifyToken(token);

		if (decoded.userType !== UserTypeEnum.ADMIN) {
			throw httpException("Token inválido para este tipo de usuário", httpStatus.UNAUTHORIZED);
		}

		const admin = await this.adminRepository.findById(decoded.userId);

		if (!admin) {
			throw httpException("Usuário não encontrado", httpStatus.NOT_FOUND);
		}

		if (admin.status !== AdminStatusEnum.ATIVO) {
			throw httpException("Usuário não está ativo", httpStatus.FORBIDDEN);
		}

		return {
			success: true,
			message: "Token válido",
			data: {
				userId: admin._id,
				email: admin.email,
				name: admin.name,
			},
		};
	}

	public async refreshToken(
		refreshToken: string,
	): Promise<HttpResponse<{ token: string; refreshToken: string }>> {
		try {
			const decoded = jwt.verify(
				refreshToken,
				env.app.jwtSecret,
			) as RefreshTokenPayload;

			if (decoded.tokenType !== "refresh") {
				throw httpException("Token inválido", httpStatus.UNAUTHORIZED);
			}

			let email = "";
			let isValid = false;

			if (decoded.userType === UserTypeEnum.RESIDENT) {
				const resident = await this.residentRepository.findById(
					decoded.userId,
				);
				if (resident && resident.status === ResidentStatusEnum.ATIVO) {
					email = resident.email;
					isValid = true;
				}
			} else if (decoded.userType === UserTypeEnum.CONCIERGE) {
				const concierge = await this.conciergeRepository.findById(
					decoded.userId,
				);
				if (concierge && concierge.status === ConciergeStatusEnum.ATIVO) {
					email = concierge.email;
					isValid = true;
				}
		} else if (decoded.userType === UserTypeEnum.ADMIN) {
			const admin = await this.adminRepository.findById(decoded.userId);
			if (admin && admin.status === AdminStatusEnum.ATIVO) {
				email = admin.email;
				isValid = true;
			}
		}

			if (!isValid) {
				throw httpException(
					"Usuário não encontrado ou inativo",
					httpStatus.UNAUTHORIZED,
				);
			}

			const newToken = await this.generateToken({
				userId: decoded.userId,
				userType: decoded.userType,
				email,
			});

			const newRefreshToken = await this.generateRefreshToken({
				userId: decoded.userId,
				userType: decoded.userType,
				tokenType: "refresh",
			});

			return {
				success: true,
				message: "Token renovado com sucesso",
				data: {
					token: newToken,
					refreshToken: newRefreshToken,
				},
			};
		} catch (error) {
			throw httpException(
				"Refresh token inválido ou expirado",
				httpStatus.UNAUTHORIZED,
			);
		}
	}

	public async verifyToken(token: string): Promise<JwtPayload> {
		try {
			const decoded = jwt.verify(token, env.app.jwtSecret) as JwtPayload;
			return decoded;
		} catch (error) {
			throw httpException("Token inválido ou expirado", httpStatus.UNAUTHORIZED);
		}
	}

	private async generateToken(payload: JwtPayload): Promise<string> {
		// @ts-expect-error - expiresIn aceita string mas o tipo do zod está causando conflito
		return jwt.sign(payload, env.app.jwtSecret, {
			expiresIn: env.app.jwtExpiration,
		});
	}

	private async generateRefreshToken(
		payload: RefreshTokenPayload,
	): Promise<string> {
		// @ts-expect-error - expiresIn aceita string mas o tipo do zod está causando conflito
		return jwt.sign(payload, env.app.jwtSecret, {
			expiresIn: env.app.jwtRefreshExpiration,
		});
	}

	private async comparePassword(
		password: string,
		hash: string,
	): Promise<boolean> {
		const bcrypt = await import("bcrypt");
		return await bcrypt.compare(password, hash);
	}
}

