import { PollStatusEnumType } from "@/v1/enum/pollStatus.enum";

export interface PollOption {
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
	status: PollStatusEnumType;
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
	status: PollStatusEnumType;
	startDate: Date;
	endDate: Date;
};

export type UpdatePollEntity = Partial<
	Pick<PollEntity, "description" | "status" | "startDate" | "endDate" | "cancelReason" | "cancelledAt" | "updatedAt">
>;


