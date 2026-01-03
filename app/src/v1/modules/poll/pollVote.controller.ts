import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import { httpException } from "../../../config/error";
import { UserTypeEnum } from "../../enum/userType.enum";
import { transformPollVoteDto } from "./dto";
import { PollVoteService } from "./pollVote.service";

export class PollVoteController {
	private pollVoteService: PollVoteService;

	constructor(mongoClient: MongoClient) {
		this.pollVoteService = new PollVoteService(mongoClient);
	}

	public async vote(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.RESIDENT) {
			throw httpException(
				"Apenas moradores podem votar em enquetes",
				httpStatus.FORBIDDEN,
			);
		}

		const residentId = request.user.userId;

		return reply
			.status(httpStatus.OK)
			.send(
				await this.pollVoteService.vote(
					transformPollVoteDto(request.body),
					residentId,
				),
			);
	}

	public async deleteVote(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.RESIDENT) {
			throw httpException(
				"Apenas moradores podem deletar votos em enquetes",
				httpStatus.FORBIDDEN,
			);
		}

		const residentId = request.user.userId;
		const { pollId } = request.params as { pollId: string };

		return reply
			.status(httpStatus.OK)
			.send(
				await this.pollVoteService.deleteVote(pollId, residentId),
			);
	}

	public async getMyVote(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.RESIDENT) {
			throw httpException(
				"Apenas moradores podem visualizar seus votos",
				httpStatus.FORBIDDEN,
			);
		}

		const residentId = request.user.userId;
		const { pollId } = request.params as { pollId: string };

		return reply
			.status(httpStatus.OK)
			.send(
				await this.pollVoteService.getMyVote(pollId, residentId),
			);
	}
}

