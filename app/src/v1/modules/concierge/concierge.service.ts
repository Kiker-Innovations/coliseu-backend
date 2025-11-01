import type { MongoClient } from "mongodb";
import type {
    CreateConciergeEntity,
} from "@/database/mongodb/entity/concierge.entity";
import { ConciergeRepository } from "@/database/mongodb/repositories/concierge.repository";
import { ConciergeStatusEnum } from "../../enum/conciergeStatus.enum";
import { httpException } from "@/config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "@/interface/httpResponse.interface";
import { ConciergeCreateDto } from "./dto/conciergeCreate.dto";
import { hashPassword, generateCode, generateResetToken, comparePassword } from "@/v1/utils/cryptoHelper";
import { sendConfirmationEmailAsync, sendPasswordResetEmailAsync } from "@/v1/utils/emailHelper";
import { ConciergeUpdateDto } from "./dto/conciergeUpdate.dto";
import { ConciergeConfirmDto } from "./dto/conciergeConfirm.dto";
import { ConciergeForgetPasswordDto } from "./dto/conciergeForgetPassword.dto";
import { ConciergeResetPasswordDto } from "./dto/conciergeResetPassword.dto";
import { ConciergeLoginDto } from "./dto/conciergeLogin.dto";

export class ConciergeService {
    private conciergeRepository: ConciergeRepository;

    constructor(mongoClient: MongoClient) {
        this.conciergeRepository = new ConciergeRepository(mongoClient);
    }

    public async createConcierge(conciergeCreateDto: ConciergeCreateDto): Promise<
        HttpResponse<{
            email: string;
            phone: string;
        }>
    > {
        const existingConcierge = await this.conciergeRepository.findByEmail(
            conciergeCreateDto.email,
        );

        if (existingConcierge) {
            throw httpException(
                "Email já cadastrado no sistema.",
                httpStatus.CONFLICT,
            );
        }

        const passwordHash = await hashPassword(conciergeCreateDto.password);
        const conciergeCode = await generateCode();

        const conciergeEntity: CreateConciergeEntity = {
            name: conciergeCreateDto.name,
            email: conciergeCreateDto.email,
            passwordHash,
            phone: conciergeCreateDto.phone,
            status: ConciergeStatusEnum.INATIVO,
            shift: conciergeCreateDto.shift,
            code: conciergeCode,
        };

        const createdConcierge =
            await this.conciergeRepository.create(conciergeEntity);

        sendConfirmationEmailAsync(conciergeCreateDto.email, conciergeCode);

        return {
            success: true,
            message:
                "Porteiro cadastrado com sucesso! Verifique o email registrado para confirmar o cadastro.",
            data: {
                email: createdConcierge.email,
                phone: createdConcierge.phone,
            },
        };
    }

    public async getConcierge(conciergeId: string): Promise<
        HttpResponse<{
            name: string;
            email: string;
            phone: string;
            shift: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
        }>
    > {
        const concierge = await this.conciergeRepository.findById(conciergeId);

        if (!concierge) {
            throw httpException("Porteiro não encontrado", httpStatus.NOT_FOUND);
        }

        return {
            success: true,
            message: "Porteiro encontrado com sucesso",
            data: {
                name: concierge.name,
                email: concierge.email,
                phone: concierge.phone,
                shift: concierge.shift,
                status: concierge.status,
                createdAt: concierge.createdAt,
                updatedAt: concierge.createdAt,
            },
        };
    }

    public async updateConcierge(
        conciergeId: string,
        conciergeUpdateDto: ConciergeUpdateDto,
    ): Promise<
        HttpResponse<{
            name: string;
            email: string;
            phone: string;
            shift: string;
        }>
    > {
        const concierge = await this.conciergeRepository.findById(conciergeId);

        if (!concierge) {
            throw httpException("Porteiro não encontrado", httpStatus.NOT_FOUND);
        }

        const updatedConcierge = await this.conciergeRepository.update(
            conciergeId,
            conciergeUpdateDto,
        );

        if (!updatedConcierge) {
            throw httpException(
                "Erro ao atualizar porteiro",
                httpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        return {
            success: true,
            message: "Porteiro atualizado com sucesso",
            data: {
                name: updatedConcierge.name,
                email: updatedConcierge.email,
                phone: updatedConcierge.phone,
                shift: updatedConcierge.shift,
            },
        };
    }

    public async deleteConcierge(conciergeId: string): Promise<HttpResponse<null>> {
        const concierge = await this.conciergeRepository.findById(conciergeId);

        if (!concierge) {
            throw httpException("Porteiro não encontrado", httpStatus.NOT_FOUND);
        }

        const deleted = await this.conciergeRepository.delete(conciergeId);

        if (!deleted) {
            throw httpException(
                "Erro ao deletar porteiro",
                httpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        return {
            success: true,
            message: "Porteiro deletado com sucesso",
            data: null,
        };
    }

    public async confirmConciergeCode(
        conciergeConfirmDto: ConciergeConfirmDto,
    ): Promise<HttpResponse<null>> {
        const concierge = await this.conciergeRepository.findByEmail(conciergeConfirmDto.email);
        if (!concierge) {
            throw httpException("Morador não encontrado", httpStatus.NOT_FOUND);
        }

        if (
            concierge.status === ConciergeStatusEnum.VALIDADO ||
            concierge.status === ConciergeStatusEnum.ATIVO
        ) {
            throw httpException(
                "Cadastro já foi confirmado anteriormente",
                httpStatus.BAD_REQUEST,
            );
        }

        if (concierge.code !== conciergeConfirmDto.code) {
            throw httpException(
                "Código de confirmação inválido",
                httpStatus.BAD_REQUEST,
            );
        }

        await this.conciergeRepository.updateByEmail(conciergeConfirmDto.email, {
            status: ConciergeStatusEnum.VALIDADO,
        });

        return {
            success: true,
            message:
                "Cadastro confirmado com sucesso!",
            data: null,
        };
    }


    public async getManyConcierges(): Promise<
        HttpResponse<{
            name: string;
            email: string;
            phone: string;
            shift: string;
            status: string;
        }[]>
    > {
        const concierges = await this.conciergeRepository.findMany();

        if (!concierges || concierges.length === 0) {
            throw httpException("Nenhum porteiro encontrado", httpStatus.NOT_FOUND);
        }

        return {
            success: true,
            message: "Porteiros encontrados com sucesso",
            data: concierges
        };
    }

    public async forgetPassword(
        forgetPasswordDto: ConciergeForgetPasswordDto,
    ): Promise<HttpResponse<null>> {
        const concierge = await this.conciergeRepository.findByEmail(
            forgetPasswordDto.email,
        );

        // Por segurança, sempre retornamos a mesma mensagem, independentemente se o email existe
        if (concierge) {
            const resetToken = await generateResetToken();
            const resetTokenExpiry = new Date();
            resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // Expira em 1 hora

            await this.conciergeRepository.updateByEmail(forgetPasswordDto.email, {
                resetPasswordToken: resetToken,
                resetPasswordTokenExpiry: resetTokenExpiry,
            });

            sendPasswordResetEmailAsync(forgetPasswordDto.email, resetToken);
        }

        return {
            success: true,
            message:
                "Se o email estiver cadastrado, você receberá um email com as instruções para redefinir sua senha.",
            data: null,
        };
    }

    public async resetPassword(
        resetPasswordDto: ConciergeResetPasswordDto,
    ): Promise<HttpResponse<null>> {
        const concierge = await this.conciergeRepository.findOne({
            resetPasswordToken: resetPasswordDto.token,
        });

        if (!concierge) {
            throw httpException(
                "Token de redefinição inválido ou expirado",
                httpStatus.BAD_REQUEST,
            );
        }

        if (!concierge.resetPasswordTokenExpiry) {
            throw httpException(
                "Token de redefinição inválido ou expirado",
                httpStatus.BAD_REQUEST,
            );
        }

        const now = new Date();
        if (now > concierge.resetPasswordTokenExpiry) {
            throw httpException(
                "Token de redefinição expirado. Solicite um novo reset de senha.",
                httpStatus.BAD_REQUEST,
            );
        }

        if (concierge.resetPasswordToken !== resetPasswordDto.token) {
            throw httpException(
                "Token de redefinição inválido",
                httpStatus.BAD_REQUEST,
            );
        }

        const passwordHash = await hashPassword(resetPasswordDto.password);

        await this.conciergeRepository.updateByEmail(concierge.email, {
            passwordHash,
            resetPasswordToken: undefined,
            resetPasswordTokenExpiry: undefined,
        });

        return {
            success: true,
            message: "Senha redefinida com sucesso!",
            data: null,
        };
    }

    public async login(
        loginDto: ConciergeLoginDto,
    ): Promise<
        HttpResponse<{
            id: string;
            name: string;
            email: string;
            phone: string;
            shift: string;
            status: string;
        }>
    > {
        const concierge = await this.conciergeRepository.findByEmail(
            loginDto.email,
        );

        if (!concierge) {
            throw httpException(
                "Email ou senha inválidos",
                httpStatus.UNAUTHORIZED,
            );
        }

        const isPasswordValid = await comparePassword(
            loginDto.password,
            concierge.passwordHash,
        );

        if (!isPasswordValid) {
            throw httpException(
                "Email ou senha inválidos",
                httpStatus.UNAUTHORIZED,
            );
        }

        if (
            concierge.status === ConciergeStatusEnum.INATIVO
        ) {
            throw httpException(
                "Conta não confirmada. Verifique seu email para ativar a conta.",
                httpStatus.FORBIDDEN,
            );
        }

        return {
            success: true,
            message: "Login realizado com sucesso",
            data: {
                id: concierge._id,
                name: concierge.name,
                email: concierge.email,
                phone: concierge.phone,
                shift: concierge.shift,
                status: concierge.status,
            },
        };
    }
}
