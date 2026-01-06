import type { RouteHandlerMethod, RouteOptions } from "fastify";
import type { MongoClient } from "mongodb";
import { NoticeController } from "./notice.controller";
import { NoticeSchema } from "./notice.schema";

export class NoticeRouteV1 {
	private noticeController: NoticeController;
	private noticeSchema: NoticeSchema;

	constructor(mongoClient: MongoClient) {
		this.noticeController = new NoticeController(mongoClient);
		this.noticeSchema = new NoticeSchema();
	}

	private create = (): RouteOptions => {
		return {
			method: "POST",
			url: "/v1/notices",
			schema: {
				tags: ["Notices"],
				summary: "Create a new notice",
				description:
					"Cria um novo aviso e retorna uma URL pré-assinada para upload do arquivo (apenas admin)",
				...this.noticeSchema.create,
			},
			handler: this.noticeController.createNotice.bind(
				this.noticeController,
			) as RouteHandlerMethod,
		};
	};

	private getAll = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/notices",
			schema: {
				tags: ["Notices"],
				summary: "Get all notices for the building",
				description:
					"Lista todos os avisos do edifício do usuário, com filtro opcional por status (apenas admin e resident)",
				...this.noticeSchema.getAll,
			},
			handler: this.noticeController.getNotices.bind(
				this.noticeController,
			) as RouteHandlerMethod,
		};
	};

	private getById = (): RouteOptions => {
		return {
			method: "GET",
			url: "/v1/notices/:id",
			schema: {
				tags: ["Notices"],
				summary: "Get notice by ID",
				description:
					"Busca um aviso específico por ID (apenas admin e resident)",
				...this.noticeSchema.getById,
			},
			handler: this.noticeController.getNoticeById.bind(
				this.noticeController,
			) as RouteHandlerMethod,
		};
	};

	private remove = (): RouteOptions => {
		return {
			method: "DELETE",
			url: "/v1/notices/:id",
			schema: {
				tags: ["Notices"],
				summary: "Delete notice",
				description: "Remove um aviso do sistema (apenas admin)",
				...this.noticeSchema.remove,
			},
			handler: this.noticeController.deleteNotice.bind(
				this.noticeController,
			) as RouteHandlerMethod,
		};
	};

	public routes = (): RouteOptions[] => {
		return [this.create(), this.getAll(), this.getById(), this.remove()];
	};
}
