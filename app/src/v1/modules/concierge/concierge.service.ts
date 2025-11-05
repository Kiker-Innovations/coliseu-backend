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
import {
	hashPassword,
	generateCode,
	generateResetCode,
	comparePassword,
} from "@/v1/utils/cryptoHelper";
import {
	sendPasswordResetEmail,
} from "@/v1/utils/emailHelper";
import { ConciergeUpdateDto } from "./dto/conciergeUpdate.dto";
import { ConciergeConfirmDto } from "./dto/conciergeConfirm.dto";
import { ConciergeForgetPasswordDto } from "./dto/conciergeForgetPassword.dto";
import { ConciergeResetPasswordDto } from "./dto/conciergeResetPassword.dto";
import { getDate } from "@/v1/utils/utils";
import { ConciergeEmail } from "./concierge.emails";

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

        const conciergeEmail = new ConciergeEmail();
        conciergeEmail.sendConfirmationEmailAsync(
            createdConcierge.email,
            createdConcierge.name,
            createdConcierge.shift,
            conciergeCode,
        );

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
            status: ConciergeStatusEnum.ATIVO,
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

        if (!concierge) {
            throw httpException("Email não encontrado", httpStatus.NOT_FOUND);
        }

        const resetCode = generateResetCode();
        const resetTokenExpiry = getDate();
        resetTokenExpiry.setMinutes(resetTokenExpiry.getMinutes() + 15);

        await this.conciergeRepository.updateByEmail(forgetPasswordDto.email, {
            resetPasswordToken: resetCode,
            resetPasswordTokenExpiry: resetTokenExpiry,
        });

        sendPasswordResetEmail(
            concierge.email,
            concierge.name,
            resetCode,
            "https://coliseucondo.com.br/concierge/reset-password",
        );

        return {
            success: true,
            message:
                "Código de recuperação enviado para seu email. Verifique sua caixa de entrada.",
            data: null,
        };
    }

    public async resetPassword(
        resetPasswordDto: ConciergeResetPasswordDto,
    ): Promise<HttpResponse<null>> {
        const concierge = await this.conciergeRepository.findByEmail(
            resetPasswordDto.email,
        );

        if (!concierge) {
            throw httpException("Email não encontrado", httpStatus.NOT_FOUND);
        }

        if (!concierge.resetPasswordToken || !concierge.resetPasswordTokenExpiry) {
            throw httpException(
                "Nenhuma solicitação de recuperação de senha encontrada",
                httpStatus.BAD_REQUEST,
            );
        }

        if (concierge.resetPasswordToken !== resetPasswordDto.code) {
            throw httpException(
                "Código de recuperação inválido",
                httpStatus.BAD_REQUEST,
            );
        }

        const now = getDate();
        if (now > concierge.resetPasswordTokenExpiry) {
            throw httpException(
                "Código de recuperação expirado. Solicite um novo código.",
                httpStatus.BAD_REQUEST,
            );
        }

        const passwordHash = await hashPassword(resetPasswordDto.newPassword);

        await this.conciergeRepository.updateByEmail(concierge.email, {
            passwordHash,
            resetPasswordToken: undefined,
            resetPasswordTokenExpiry: undefined,
        });

        return {
            success: true,
            message: "Senha redefinida com sucesso! Você já pode fazer login.",
            data: null,
        };
    }
}
