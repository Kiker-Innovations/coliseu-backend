export interface PollOption {
	id: number;
	description: string;
	votes: number;
	percent: number;
}

export interface PollEntity {
	_id: string;
	buildingId: string;
	description: string;
	options: PollOption[];
	votes: number;
	startDate: Date;
	endDate: Date;
	cancelledAt?: Date;
	cancelReason?: string;
	createdAt: Date;
	updatedAt: Date;
}

export type CreatePollEntity = {
	buildingId: string;
	description: string;
	options: string[]; // No cadastro, recebe array de strings
	startDate: Date;
	endDate: Date;
};

export type UpdatePollEntity = Partial<
	Pick<
		PollEntity,
		| "description"
		| "startDate"
		| "endDate"
		| "cancelReason"
		| "cancelledAt"
		| "updatedAt"
	>
>;
