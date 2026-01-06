import type { NoticeStatusEnumType } from "@/v1/enum/noticeStatus.enum";

export interface NoticeEntity {
	_id: string;
	buildingId: string;
	title: string;
	content: string;
	fileName: string;
	fileSize: number;
	url: string;
	mimeType: string;
	status: NoticeStatusEnumType;
	deletedNote?: string;
	createdAt: Date;
	deletedAt?: Date;
}

export type CreateNoticeEntity = Omit<
	NoticeEntity,
	"_id" | "createdAt" | "deletedAt"
>;

export type UpdateNoticeEntity = Partial<
	Pick<NoticeEntity, "title" | "content" | "status" | "deletedAt">
>;
