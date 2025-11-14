import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import { ConciergeService } from "./concierge.service";
import { transformCreateConciergeDto } from "./dto/conciergeCreate.dto";
import { transformUpdateConciergeDto } from "./dto/conciergeUpdate.dto";
import { transformConfirmConciergeDto } from "./dto/conciergeConfirm.dto";
import { transformForgetPasswordConciergeDto } from "./dto/conciergeForgetPassword.dto";
import { transformResetPasswordConciergeDto } from "./dto/conciergeResetPassword.dto";

export class ConciergeController {
    private conciergeService: ConciergeService;

    constructor(mongoClient: MongoClient) {
        this.conciergeService = new ConciergeService(mongoClient);
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

    public async confirmConcierge(
        request: FastifyRequest,
        reply: FastifyReply,
    ): Promise<void> {
        return reply
            .status(httpStatus.OK)
            .send(
                await this.conciergeService.confirmConciergeCode(
                    transformConfirmConciergeDto(request.body),
                ),
            );
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
}
