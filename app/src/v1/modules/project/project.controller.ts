import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import { httpException } from "../../../config/error";
import { transformCreateProjectDto, transformUpdateProjectDto } from "./dto";
import { ProjectService } from "./project.service";
import { UserTypeEnum } from "../../enum/userType.enum";

export class ProjectController {
	private projectService: ProjectService;

	constructor(mongoClient: MongoClient) {
		this.projectService = new ProjectService(mongoClient);
	}

	public async createProject(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.ADMIN) {
			throw httpException(
				"Apenas administradores podem criar projetos",
				httpStatus.FORBIDDEN,
			);
		}

		return reply
			.code(httpStatus.CREATED)
			.send(
				await this.projectService.createProject(
					transformCreateProjectDto(request.body),
					request.user.buildingId,
					request.user.actualSeasonId,
				),
			);
	}

	public async getAllProjectsByBuildingAndSeason(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		return reply
			.status(httpStatus.OK)
			.send(
				await this.projectService.getAllProjectsByBuildingAndSeason(
					request.user.buildingId,
					request.user.actualSeasonId,
				),
			);
	}

	public async getProjectById(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const { id } = request.params as { id: string };
		return reply
			.status(httpStatus.OK)
			.send(
				await this.projectService.getProjectById(
					id,
					request.user.buildingId,
				),
			);
	}

	public async getProjectsWithPendingPayments(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.ADMIN) {
			throw httpException(
				"Apenas administradores podem visualizar pagamentos pendentes",
				httpStatus.FORBIDDEN,
			);
		}

		return reply
			.status(httpStatus.OK)
			.send(
				await this.projectService.getProjectsWithPendingPayments(
					request.user.buildingId,
				),
			);
	}

	public async updateProject(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.ADMIN) {
			throw httpException(
				"Apenas administradores podem atualizar projetos",
				httpStatus.FORBIDDEN,
			);
		}

		const { id } = request.params as { id: string };
		return reply
			.status(httpStatus.OK)
			.send(
				await this.projectService.updateProject(
					id,
					transformUpdateProjectDto(request.body),
					request.user.buildingId,
				),
			);
	}

	public async deleteProject(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		if (request.user.userType !== UserTypeEnum.ADMIN) {
			throw httpException(
				"Apenas administradores podem deletar projetos",
				httpStatus.FORBIDDEN,
			);
		}

		const { id } = request.params as { id: string };
		return reply
			.status(httpStatus.OK)
			.send(
				await this.projectService.deleteProject(
					id,
					request.user.buildingId,
				),
			);
	}
}

