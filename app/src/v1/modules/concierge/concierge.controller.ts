import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import { ConciergeService } from "./concierge.service";
import { transformCreateConciergeDto } from "./dto/conciergeCreate.dto";
import { transformUpdateConciergeDto } from "./dto/conciergeUpdate.dto";
import { transformForgetPasswordConciergeDto } from "./dto/conciergeForgetPassword.dto";
import { transformResetPasswordConciergeDto } from "./dto/conciergeResetPassword.dto";
import { AuthService } from "../auth/auth.service";
import { transformLoginConciergeDto } from "../auth/dto";

export class ConciergeController {
    private conciergeService: ConciergeService;
    private authService: AuthService;

    constructor(mongoClient: MongoClient) {
        this.conciergeService = new ConciergeService(mongoClient);
        this.authService = new AuthService(mongoClient);
    }

    public async createConcierge(
        request: FastifyRequest,
        reply: FastifyReply,
    ): Promise<void> {
        return reply
            .code(httpStatus.CREATED)
            .send(
                await this.conciergeService.createConcierge(
                    transformCreateConciergeDto(request.body),
                ),
            );
    }

    public async getConcierge(
        request: FastifyRequest,
        reply: FastifyReply,
    ): Promise<void> {
        const { id } = request.params as { id: string };
        return reply
            .status(httpStatus.OK)
            .send(await this.conciergeService.getConcierge(id));
    }

    public async updateConcierge(
        request: FastifyRequest,
        reply: FastifyReply,
    ): Promise<void> {
        const { id } = request.params as { id: string };
        return reply
            .status(httpStatus.OK)
            .send(
                await this.conciergeService.updateConcierge(
                    id,
                    transformUpdateConciergeDto(request.body),
                ),
            );
    }

    public async deleteConcierge(
        request: FastifyRequest,
        reply: FastifyReply,
    ): Promise<void> {
        const { id } = request.params as { id: string };
        return reply
            .status(httpStatus.OK)
            .send(await this.conciergeService.deleteConcierge(id));
    }

    public async getManyConcierges(
        request: FastifyRequest,
        reply: FastifyReply,
    ): Promise<void> {
        return reply
            .status(httpStatus.OK)
            .send(await this.conciergeService.getManyConcierges());
    }

    public async forgetPassword(
        request: FastifyRequest,
        reply: FastifyReply,
    ): Promise<void> {
        return reply
            .status(httpStatus.OK)
            .send(
                await this.conciergeService.forgetPassword(
                    transformForgetPasswordConciergeDto(request.body),
                ),
            );
    }

    public async resetPassword(
        request: FastifyRequest,
        reply: FastifyReply,
    ): Promise<void> {
        return reply
            .status(httpStatus.OK)
            .send(
                await this.conciergeService.resetPassword(
                    transformResetPasswordConciergeDto(request.body),
                ),
            );
    }

    public async login(
        request: FastifyRequest,
        reply: FastifyReply,
    ): Promise<void> {
        return reply
            .status(httpStatus.OK)
            .send(
                await this.authService.loginConcierge(
                    transformLoginConciergeDto(request.body),
                ),
            );
    }
}
