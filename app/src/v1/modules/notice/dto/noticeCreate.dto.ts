import { z } from "zod";

const MAX_FILE_SIZE = 300 * 1024 * 1024; // 300MB

const ACCEPTED_FILE_TYPES = [
	"application/pdf",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/vnd.ms-powerpoint",
	"application/vnd.openxmlformats-officedocument.presentationml.presentation",
	"image/jpeg",
	"image/jpg",
	"image/png",
];

const ACCEPTED_FILE_EXTENSIONS = [
	".pdf",
	".doc",
	".docx",
	".ppt",
	".pptx",
	".jpeg",
	".jpg",
	".png",
];

export const noticeCreateSchema = z.object({
	buildingId: z
		.string({ required_error: "ID do edifício é obrigatório" })
		.uuid("ID do edifício deve ser um UUID válido"),
	title: z
		.string({ required_error: "Título do aviso é obrigatório" })
		.min(3, "Título deve ter no mínimo 3 caracteres")
		.max(200, "Título deve ter no máximo 200 caracteres")
		.trim(),
	content: z
		.string({ required_error: "Conteúdo é obrigatório" })
		.min(10, "Conteúdo deve ter no mínimo 10 caracteres")
		.max(10000, "Conteúdo deve ter no máximo 10000 caracteres"),
	fileName: z
		.string({ required_error: "Nome do arquivo é obrigatório" })
		.min(1, "Nome do arquivo é obrigatório")
		.refine(
			(name) =>
				ACCEPTED_FILE_EXTENSIONS.some((ext) =>
					name.toLowerCase().endsWith(ext),
				),
			`Extensão do arquivo deve ser: ${ACCEPTED_FILE_EXTENSIONS.join(", ")}`,
		),
	fileSize: z
		.number({ required_error: "Tamanho do arquivo é obrigatório" })
		.positive("Tamanho do arquivo deve ser positivo")
		.max(MAX_FILE_SIZE, "Tamanho máximo do arquivo é 300MB"),
	mimeType: z
		.string({ required_error: "Tipo do arquivo é obrigatório" })
		.refine(
			(type) => ACCEPTED_FILE_TYPES.includes(type),
			`Tipo de arquivo deve ser: PDF, DOC, DOCX, PPT, PPTX, JPEG, JPG ou PNG`,
		),
	status: z
		.enum(["ATIVO", "INATIVO"], {
			required_error: "Status é obrigatório",
		})
		.default("ATIVO"),
});

export type NoticeCreateDto = z.infer<typeof noticeCreateSchema>;

export const transformCreateNoticeDto = (
	data: NoticeCreateDto,
): NoticeCreateDto => {
	return noticeCreateSchema.parse(data);
};

export { MAX_FILE_SIZE, ACCEPTED_FILE_TYPES, ACCEPTED_FILE_EXTENSIONS };
