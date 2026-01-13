export interface PageEntity {
	_id: string;
	title: string;
	url: string;
	icon: string;
	order: number;
	isActive: boolean;
	roleId: string;
	createdAt: Date;
	updatedAt: Date;
}

export type CreatePageEntity = Omit<
	PageEntity,
	"_id" | "createdAt" | "updatedAt"
>;

export type UpdatePageEntity = Partial<
	Pick<
		PageEntity,
		"title" | "url" | "icon" | "order" | "isActive" | "roleId" | "updatedAt"
	>
>;
