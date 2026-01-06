import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import type { MongoClient } from "mongodb";
import { env } from "../../../config/env";
import { httpException } from "../../../config/error";
import { AdminRepository } from "../../../database/mongodb/repositories/admin.repository";
import { ConciergeRepository } from "../../../database/mongodb/repositories/concierge.repository";
import { ResidentRepository } from "../../../database/mongodb/repositories/resident.repository";
import { BuildingRepository } from "../../../database/mongodb/repositories/building.repository";
import { ApartmentRepository } from "../../../database/mongodb/repositories/apartment.repository";
import type { HttpResponse } from "../../../interface/httpResponse.interface";
import type { JwtPayload } from "../../../interface/jwtPayload.interface";
import type { RefreshTokenPayload } from "../../../interface/refreshTokenPayload.interface";
import { ResidentStatusEnum } from "../../enum/residentStatus.enum";
import { UserTypeEnum } from "../../enum/userType.enum";
import type { LoginAdminDto, LoginConciergeDto, LoginResidentDto } from "./dto";
import { ConciergeStatusEnum } from "@/v1/enum/conciergeStatus.enum";
import { AdminStatusEnum } from "@/v1/enum/adminStatus.enum";
import { SeasonRepository } from "@/database/mongodb/repositories/season.repository";

export class AuthService {
	private residentRepository: ResidentRepository;
	private conciergeRepository: ConciergeRepository;
	private adminRepository: AdminRepository;
	private buildingRepository: BuildingRepository;
	private apartmentRepository: ApartmentRepository;
	private seasonRepository: SeasonRepository;

	constructor(mongoClient: MongoClient) {
		this.residentRepository = new ResidentRepository(mongoClient);
		this.conciergeRepository = new ConciergeRepository(mongoClient);
		this.adminRepository = new AdminRepository(mongoClient);
		this.buildingRepository = new BuildingRepository(mongoClient);
		this.apartmentRepository = new ApartmentRepository(mongoClient);
		this.seasonRepository = new SeasonRepository(mongoClient);
	}

	public async loginResident(
		loginResidentDto: LoginResidentDto,
	): Promise<HttpResponse<{ token: string; refreshToken: string }>> {
		const building = await this.buildingRepository.findById(
			loginResidentDto.buildingId,
		);

		if (!building) {
			throw httpException("Edifício não encontrado", httpStatus.NOT_FOUND);
		}

		const resident = await this.residentRepository.findByEmail(
			loginResidentDto.email,
		);

		if (!resident) {
			throw httpException("Credenciais inválidas", httpStatus.UNAUTHORIZED);
		}

		if (resident.buildingId !== loginResidentDto.buildingId) {
			throw httpException("Credenciais inválidas", httpStatus.UNAUTHORIZED);
		}

		if (resident.status === ResidentStatusEnum.A_CONFIRMACAO_EMAIL) {
			throw httpException(
				"Cadastro não confirmado. Verifique seu email.",
				httpStatus.FORBIDDEN,
			);
		}

		if (resident.status === ResidentStatusEnum.A_VALIDACAO) {
			throw httpException(
				"Cadastro aguardando aprovação do administrador.",
				httpStatus.FORBIDDEN,
			);
		}

		if (resident.status === ResidentStatusEnum.REJEITADO) {
			throw httpException(
				"Cadastro rejeitado. Verifique os motivos e atualize seus dados.",
				httpStatus.FORBIDDEN,
			);
		}

		const isPasswordValid = await this.comparePassword(
			loginResidentDto.password,
			resident.passwordHash,
		);

		if (!isPasswordValid) {
			throw httpException("Credenciais inválidas", httpStatus.UNAUTHORIZED);
		}

		const apartment = resident.apartmentId
			? await this.apartmentRepository.findById(resident.apartmentId)
			: null;

		const seasons = await this.seasonRepository.findManyByBuildingId(
			resident.buildingId,
		);

		const token = await this.generateToken({
			userId: resident._id,
			userType: UserTypeEnum.RESIDENT,
			buildingId: resident.buildingId,
			email: resident.email,
			name: resident.name,
			phone: resident.phone,
			photoUrl: resident.photoUrl || null,
			apartmentId: resident.apartmentId || undefined,
			apartmentNumber: apartment?.number,
			blockName: apartment?.block,
			buildingName: building.name,
			actualSeasonId: seasons[0]?._id ?? null,
		});

		const refreshToken = await this.generateRefreshToken({
			userId: resident._id,
			userType: UserTypeEnum.RESIDENT,
			buildingId: resident.buildingId,
			tokenType: "refresh",
			actualSeasonId: seasons[0]?._id ?? null,
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
		const building = await this.buildingRepository.findById(
			loginConciergeDto.buildingId,
		);

		if (!building) {
			throw httpException("Edifício não encontrado", httpStatus.NOT_FOUND);
		}

		const concierge = await this.conciergeRepository.findByEmail(
			loginConciergeDto.email,
		);

		if (!concierge) {
			throw httpException("Credenciais inválidas", httpStatus.UNAUTHORIZED);
		}

		if (concierge.buildingId !== loginConciergeDto.buildingId) {
			throw httpException("Credenciais inválidas", httpStatus.UNAUTHORIZED);
		}

		if (concierge.status !== ConciergeStatusEnum.ATIVO) {
			throw httpException("Usuário não está ativo.", httpStatus.FORBIDDEN);
		}

		const isPasswordValid = await this.comparePassword(
			loginConciergeDto.password,
			concierge.passwordHash,
		);

		if (!isPasswordValid) {
			throw httpException("Credenciais inválidas", httpStatus.UNAUTHORIZED);
		}

		const token = await this.generateToken({
			userId: concierge._id,
			userType: UserTypeEnum.CONCIERGE,
			buildingId: concierge.buildingId,
			email: concierge.email,
			name: concierge.name,
			phone: concierge.phone,
			photoUrl: concierge.photoUrl || null,
			shift: concierge.shift,
			buildingName: building.name,
			actualSeasonId: null,
		});

		const refreshToken = await this.generateRefreshToken({
			userId: concierge._id,
			userType: UserTypeEnum.CONCIERGE,
			buildingId: concierge.buildingId,
			tokenType: "refresh",
			actualSeasonId: null,
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
		const building = await this.buildingRepository.findById(
			loginAdminDto.buildingId,
		);

		if (!building) {
			throw httpException("Edifício não encontrado", httpStatus.NOT_FOUND);
		}

		const admin = await this.adminRepository.findByEmail(loginAdminDto.email);

		if (!admin) {
			throw httpException("Credenciais inválidas", httpStatus.UNAUTHORIZED);
		}

		if (admin.buildingId !== loginAdminDto.buildingId) {
			throw httpException("Credenciais inválidas", httpStatus.UNAUTHORIZED);
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
			throw httpException("Credenciais inválidas", httpStatus.UNAUTHORIZED);
		}

		const seasons = await this.seasonRepository.findManyByBuildingId(
			admin.buildingId,
		);

		const token = await this.generateToken({
			userId: admin._id,
			userType: UserTypeEnum.ADMIN,
			buildingId: admin.buildingId,
			email: admin.email,
			name: admin.name,
			phone: admin.phone,
			buildingName: building.name,
			actualSeasonId: seasons[0]?._id ?? null,
		});

		const refreshToken = await this.generateRefreshToken({
			userId: admin._id,
			userType: UserTypeEnum.ADMIN,
			buildingId: admin.buildingId,
			tokenType: "refresh",
			actualSeasonId: seasons[0]?._id ?? null,
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

	public async validateResident(token: string): Promise<
		HttpResponse<{
			id: string;
			email: string;
			name: string;
			apartmentNumber: string;
			blockName: string;
			buildingName: string;
			actualSeasonId: string | null;
		}>
	> {
		const decoded = await this.verifyToken(token);

		if (decoded.userType !== UserTypeEnum.RESIDENT) {
			throw httpException(
				"Token inválido para este tipo de usuário",
				httpStatus.UNAUTHORIZED,
			);
		}

		const resident = await this.residentRepository.findById(decoded.userId);

		if (!resident) {
			throw httpException("Usuário não encontrado", httpStatus.NOT_FOUND);
		}

		if (resident.status !== ResidentStatusEnum.ATIVO) {
			throw httpException("Usuário não está ativo", httpStatus.FORBIDDEN);
		}

		const building = await this.buildingRepository.findById(
			resident.buildingId,
		);

		if (!building) {
			throw httpException("Edifício não encontrado", httpStatus.NOT_FOUND);
		}

		const apartment = await this.apartmentRepository.findById(
			resident.apartmentId,
		);

		const seasons = await this.seasonRepository.findManyByBuildingId(
			resident.buildingId,
		);

		return {
			success: true,
			message: "Token válido",
			data: {
				id: resident._id,
				email: resident.email,
				name: resident.name,
				apartmentNumber: apartment?.number,
				blockName: apartment?.block,
				buildingName: building.name,
				actualSeasonId: seasons[0]?._id ?? null,
			},
		};
	}

	public async validateConcierge(token: string): Promise<
		HttpResponse<{
			email: string;
			name: string;
			shift: string;
			buildingName: string;
			actualSeasonId: string | null;
		}>
	> {
		const decoded = await this.verifyToken(token);

		if (decoded.userType !== UserTypeEnum.CONCIERGE) {
			throw httpException(
				"Token inválido para este tipo de usuário",
				httpStatus.UNAUTHORIZED,
			);
		}

		const concierge = await this.conciergeRepository.findById(decoded.userId);

		if (!concierge) {
			throw httpException("Usuário não encontrado", httpStatus.NOT_FOUND);
		}

		if (concierge.status !== ConciergeStatusEnum.ATIVO) {
			throw httpException("Usuário não está ativo", httpStatus.FORBIDDEN);
		}

		const building = await this.buildingRepository.findById(
			concierge.buildingId,
		);

		if (!building) {
			throw httpException("Edifício não encontrado", httpStatus.NOT_FOUND);
		}

		const seasons = await this.seasonRepository.findManyByBuildingId(
			concierge.buildingId,
		);

		return {
			success: true,
			message: "Token válido",
			data: {
				email: concierge.email,
				name: concierge.name,
				shift: concierge.shift,
				buildingName: building.name,
				actualSeasonId: seasons[0]?._id ?? null,
			},
		};
	}

	public async validateAdmin(token: string): Promise<
		HttpResponse<{
			email: string;
			name: string;
			buildingName: string;
			actualSeasonId: string | null;
		}>
	> {
		const decoded = await this.verifyToken(token);

		if (decoded.userType !== UserTypeEnum.ADMIN) {
			throw httpException(
				"Token inválido para este tipo de usuário",
				httpStatus.UNAUTHORIZED,
			);
		}

		const admin = await this.adminRepository.findById(decoded.userId);

		if (!admin) {
			throw httpException("Usuário não encontrado", httpStatus.NOT_FOUND);
		}

		if (admin.status !== AdminStatusEnum.ATIVO) {
			throw httpException("Usuário não está ativo", httpStatus.FORBIDDEN);
		}

		const building = await this.buildingRepository.findById(admin.buildingId);

		if (!building) {
			throw httpException("Edifício não encontrado", httpStatus.NOT_FOUND);
		}

		const seasons = await this.seasonRepository.findManyByBuildingId(
			admin.buildingId,
		);

		return {
			success: true,
			message: "Token válido",
			data: {
				email: admin.email,
				name: admin.name,
				buildingName: building.name,
				actualSeasonId: seasons[0]?._id ?? null,
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

			let tokenPayload: Partial<JwtPayload> = {
				userId: decoded.userId,
				userType: decoded.userType,
				buildingId: decoded.buildingId,
			};
			let isValid = false;

			if (decoded.userType === UserTypeEnum.RESIDENT) {
				const resident = await this.residentRepository.findById(decoded.userId);
				if (resident && resident.status === ResidentStatusEnum.ATIVO) {
					const building = await this.buildingRepository.findById(
						resident.buildingId,
					);
					const apartment = resident.apartmentId
						? await this.apartmentRepository.findById(resident.apartmentId)
						: null;
					const seasons = await this.seasonRepository.findManyByBuildingId(
						resident.buildingId,
					);
					if (building) {
						tokenPayload.email = resident.email;
						tokenPayload.name = resident.name;
						tokenPayload.phone = resident.phone;
						tokenPayload.photoUrl = resident.photoUrl || null;
						tokenPayload.apartmentId = resident.apartmentId || undefined;
						tokenPayload.apartmentNumber = apartment?.number;
						tokenPayload.blockName = apartment?.block;
						tokenPayload.buildingName = building.name;
						tokenPayload.actualSeasonId = seasons[0]?._id ?? null;
						isValid = true;
					}
				}
			} else if (decoded.userType === UserTypeEnum.CONCIERGE) {
				const concierge = await this.conciergeRepository.findById(
					decoded.userId,
				);
				if (concierge && concierge.status === ConciergeStatusEnum.ATIVO) {
					const building = await this.buildingRepository.findById(
						concierge.buildingId,
					);
					if (building) {
						tokenPayload.email = concierge.email;
						tokenPayload.name = concierge.name;
						tokenPayload.phone = concierge.phone;
						tokenPayload.photoUrl = concierge.photoUrl || null;
						tokenPayload.shift = concierge.shift;
						tokenPayload.buildingName = building.name;
						isValid = true;
					}
				}
			} else if (decoded.userType === UserTypeEnum.ADMIN) {
				const admin = await this.adminRepository.findById(decoded.userId);
				if (admin && admin.status === AdminStatusEnum.ATIVO) {
					const building = await this.buildingRepository.findById(
						admin.buildingId,
					);
					const seasons = await this.seasonRepository.findManyByBuildingId(
						admin.buildingId,
					);
					if (building) {
						tokenPayload.email = admin.email;
						tokenPayload.name = admin.name;
						tokenPayload.buildingName = building.name;
						tokenPayload.actualSeasonId = seasons[0]?._id ?? null;
						isValid = true;
					}
				}
			}

			if (!isValid) {
				throw httpException(
					"Usuário não encontrado ou inativo",
					httpStatus.UNAUTHORIZED,
				);
			}

			const newToken = await this.generateToken(tokenPayload as JwtPayload);

			const newRefreshToken = await this.generateRefreshToken({
				userId: decoded.userId,
				userType: decoded.userType,
				buildingId: decoded.buildingId,
				tokenType: "refresh",
				actualSeasonId: decoded.actualSeasonId ?? null,
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
			throw httpException(
				"Token inválido ou expirado",
				httpStatus.UNAUTHORIZED,
			);
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
