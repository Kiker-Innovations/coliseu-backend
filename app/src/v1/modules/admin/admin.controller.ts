import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import {
	transformConfirmAdminDto,
	transformCreateAdminDto,
	transformUpdateAdminDto,
	transformForgetPasswordAdminDto,
	transformResetPasswordAdminDto,
} from "./dto";
import { AdminService } from "./admin.service";

export class AdminController {
	private adminService: AdminService;

	constructor(mongoClient: MongoClient) {
		this.adminService = new AdminService(mongoClient);
	}

	public async createAdmin(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		return reply
			.code(httpStatus.CREATED)
			.send(
				await this.adminService.createAdmin(
					transformCreateAdminDto(request.body),
				),
			);
	}

	public async getAdmin(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const { id } = request.params as { id: string };
		return reply
			.status(httpStatus.OK)
			.send(await this.adminService.getAdmin(id));
	}

	public async updateAdmin(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const { id } = request.params as { id: string };
		return reply
			.status(httpStatus.OK)
			.send(
				await this.adminService.updateAdmin(
					id,
					transformUpdateAdminDto(request.body),
				),
			);
	}

	public async deleteAdmin(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const { id } = request.params as { id: string };
		return reply
			.status(httpStatus.OK)
			.send(await this.adminService.deleteAdmin(id));
	}

	public async confirmAdmin(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		return reply
			.status(httpStatus.OK)
			.send(
				await this.adminService.confirmAdminCode(
					transformConfirmAdminDto(request.body),
				),
			);
	}

	public async forgetPassword(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		return reply
			.status(httpStatus.OK)
			.send(
				await this.adminService.forgetPassword(
					transformForgetPasswordAdminDto(request.body),
				),
			);
	}

	public async resetPassword(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		return reply
			.status(httpStatus.OK)
			.send(
				await this.adminService.resetPassword(
					transformResetPasswordAdminDto(request.body),
				),
			);
	}
}

