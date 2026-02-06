import type { MongoClient } from "mongodb";
import { PollVoteRepository } from "../../../database/mongodb/repositories/pollVote.repository";
import { PollRepository } from "../../../database/mongodb/repositories/poll.repository";
import { ResidentRepository } from "../../../database/mongodb/repositories/resident.repository";
import type { PollVoteDto } from "./dto";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";
import { PollStatusEnum } from "@/v1/enum/pollStatus.enum";
import { getDate, calculatePollStatus } from "@/v1/utils/utils";

export class PollVoteService {
	private pollVoteRepository: PollVoteRepository;
	private pollRepository: PollRepository;
	private residentRepository: ResidentRepository;

	constructor(mongoClient: MongoClient) {
		this.pollVoteRepository = new PollVoteRepository(mongoClient);
		this.pollRepository = new PollRepository(mongoClient);
		this.residentRepository = new ResidentRepository(mongoClient);
	}

	public async vote(
		pollVoteDto: PollVoteDto,
		residentId: string,
	): Promise<
		HttpResponse<{
			id: string;
			pollId: string;
			optionId: number;
			createdAt: Date;
		}>
	> {
		// Verify resident exists
		const resident = await this.residentRepository.findById(residentId);
		if (!resident) {
			throw httpException("Morador não encontrado", httpStatus.NOT_FOUND);
		}

		// Verify poll exists
		const poll = await this.pollRepository.findById(pollVoteDto.pollId);
		if (!poll) {
			throw httpException("Enquete não encontrada", httpStatus.NOT_FOUND);
		}

		// Verificar status baseado nas datas
		const pollStatus = calculatePollStatus(
			poll.startDate instanceof Date
				? poll.startDate
				: new Date(poll.startDate),
			poll.endDate instanceof Date ? poll.endDate : new Date(poll.endDate),
			poll.cancelledAt
				? poll.cancelledAt instanceof Date
					? poll.cancelledAt
					: new Date(poll.cancelledAt)
				: null,
		);

		// Verify poll is active
		if (pollStatus !== PollStatusEnum.ATIVO) {
			throw httpException(
				"Enquete não está ativa. Apenas enquetes com status ATIVO podem receber votos",
				httpStatus.BAD_REQUEST,
			);
		}

		// Verify poll is within date range
		const now = getDate();
		if (now < poll.startDate || now > poll.endDate) {
			throw httpException(
				"Enquete não está no período de votação",
				httpStatus.BAD_REQUEST,
			);
		}

		// Verify option exists
		const option = poll.options.find((opt) => opt.id === pollVoteDto.optionId);
		if (!option) {
			throw httpException(
				"Opção não encontrada nesta enquete",
				httpStatus.NOT_FOUND,
			);
		}

		// Check if resident already voted
		const existingVote =
			await this.pollVoteRepository.findByPollIdAndResidentId(
				pollVoteDto.pollId,
				residentId,
			);

		if (existingVote) {
			// Resident already voted, update the vote
			if (existingVote.optionId === pollVoteDto.optionId) {
				// Same option, no need to update
				return {
					success: true,
					message: "Voto já registrado para esta opção",
					data: {
						id: existingVote._id,
						pollId: existingVote.pollId,
						optionId: existingVote.optionId,
						createdAt: existingVote.createdAt,
					},
				};
			}

			// Update vote: decrement old option, increment new option
			await this.pollRepository.updateOptionVote(
				pollVoteDto.pollId,
				existingVote.optionId,
				pollVoteDto.optionId,
			);

			// Update the vote entity
			const updatedVote = await this.pollVoteRepository.update(
				existingVote._id,
				{
					optionId: pollVoteDto.optionId,
				},
			);

			if (!updatedVote) {
				throw httpException(
					"Erro ao atualizar voto",
					httpStatus.INTERNAL_SERVER_ERROR,
				);
			}

			return {
				success: true,
				message: "Voto atualizado com sucesso",
				data: {
					id: updatedVote._id,
					pollId: updatedVote.pollId,
					optionId: updatedVote.optionId,
					createdAt: updatedVote.createdAt,
				},
			};
		}

		// Create new vote
		const pollVote = await this.pollVoteRepository.create({
			pollId: pollVoteDto.pollId,
			optionId: pollVoteDto.optionId,
			residentId,
		});

		// Increment vote count in poll
		await this.pollRepository.incrementOptionVote(
			pollVoteDto.pollId,
			pollVoteDto.optionId,
		);

		return {
			success: true,
			message: "Voto registrado com sucesso",
			data: {
				id: pollVote._id,
				pollId: pollVote.pollId,
				optionId: pollVote.optionId,
				createdAt: pollVote.createdAt,
			},
		};
	}

	public async deleteVote(
		pollId: string,
		residentId: string,
	): Promise<HttpResponse<null>> {
		// Verify resident exists
		const resident = await this.residentRepository.findById(residentId);
		if (!resident) {
			throw httpException("Morador não encontrado", httpStatus.NOT_FOUND);
		}

		// Verify poll exists
		const poll = await this.pollRepository.findById(pollId);
		if (!poll) {
			throw httpException("Enquete não encontrada", httpStatus.NOT_FOUND);
		}

		// Verificar status baseado nas datas
		const pollStatus = calculatePollStatus(
			poll.startDate instanceof Date
				? poll.startDate
				: new Date(poll.startDate),
			poll.endDate instanceof Date ? poll.endDate : new Date(poll.endDate),
			poll.cancelledAt
				? poll.cancelledAt instanceof Date
					? poll.cancelledAt
					: new Date(poll.cancelledAt)
				: null,
		);

		// Verify poll is active
		if (pollStatus !== PollStatusEnum.ATIVO) {
			throw httpException(
				"Enquete não está ativa. Apenas enquetes com status ATIVO podem ter votos removidos",
				httpStatus.BAD_REQUEST,
			);
		}

		// Verify poll is within date range
		const now = getDate();
		if (now < poll.startDate || now > poll.endDate) {
			throw httpException(
				"Enquete não está no período de votação",
				httpStatus.BAD_REQUEST,
			);
		}

		// Check if resident has voted
		const existingVote =
			await this.pollVoteRepository.findByPollIdAndResidentId(
				pollId,
				residentId,
			);

		if (!existingVote) {
			throw httpException(
				"Voto não encontrado. Você não votou nesta enquete",
				httpStatus.NOT_FOUND,
			);
		}

		// Delete the vote
		const deleted = await this.pollVoteRepository.delete(existingVote._id);

		if (!deleted) {
			throw httpException(
				"Erro ao deletar voto",
				httpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		// Decrement vote count in poll
		await this.pollRepository.decrementOptionVote(
			pollId,
			existingVote.optionId,
		);

		return {
			success: true,
			message: "Voto deletado com sucesso",
			data: null,
		};
	}

	public async getMyVote(
		pollId: string,
		residentId: string,
	): Promise<
		HttpResponse<{
			id: string;
			pollId: string;
			optionId: number;
			createdAt: Date;
			updatedAt: Date;
		} | null>
	> {
		// Verify resident exists
		const resident = await this.residentRepository.findById(residentId);
		if (!resident) {
			throw httpException("Morador não encontrado", httpStatus.NOT_FOUND);
		}

		// Verify poll exists
		const poll = await this.pollRepository.findById(pollId);
		if (!poll) {
			throw httpException("Enquete não encontrada", httpStatus.NOT_FOUND);
		}

		// Get vote if exists
		const vote = await this.pollVoteRepository.findByPollIdAndResidentId(
			pollId,
			residentId,
		);

		if (!vote) {
			return {
				success: true,
				message: "Você ainda não votou nesta enquete",
				data: null,
			};
		}

		return {
			success: true,
			message: "Voto encontrado com sucesso",
			data: {
				id: vote._id,
				pollId: vote.pollId,
				optionId: vote.optionId,
				createdAt: vote.createdAt,
				updatedAt: vote.updatedAt,
			},
		};
	}
}
