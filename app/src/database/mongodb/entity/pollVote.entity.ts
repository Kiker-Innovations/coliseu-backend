export interface PollVoteEntity {
	_id: string;
	pollId: string;
	optionId: number;
	residentId: string;
	createdAt: Date;
	updatedAt: Date;
}

export type CreatePollVoteEntity = {
	pollId: string;
	optionId: number;
	residentId: string;
};

export type UpdatePollVoteEntity = Partial<
	Pick<PollVoteEntity, "optionId" | "updatedAt">
>;
