export interface DocumentEntity {
	_id: string;
	buildingId: string;
	roleId: string;
	name: string;
	description: string;
	url: string;
	fileName: string;
	fileSize: number;
	mimeType: string;
	createdAt: Date;
}

export type CreateDocumentEntity = Omit<DocumentEntity, "_id" | "createdAt">;

export type UpdateDocumentEntity = Partial<
	Pick<DocumentEntity, "name" | "description">
>;
