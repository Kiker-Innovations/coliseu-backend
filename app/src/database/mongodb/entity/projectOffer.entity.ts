export interface ProjectOfferEntity {
	_id: string;
	buildingId: string;
	seasonId: string;
	projectId: string;
	companyName: string;
	description: string;
	companyCnpj: string;
	totalValue: number;
	installmentsCount: number;
	paidInstallments?: number;
	votes: number;
	paymentStartDate?: Date;
	createdAt: Date;
	updatedAt: Date;
}

export type CreateProjectOfferEntity = Omit<
	ProjectOfferEntity,
	"_id" | "paidInstallments" | "paymentStartDate" | "createdAt" | "updatedAt"
>;

export type UpdateProjectOfferEntity = Partial<
	Pick<
		ProjectOfferEntity,
		"paidInstallments" | "paymentStartDate" | "votes" | "updatedAt"
	>
>;
