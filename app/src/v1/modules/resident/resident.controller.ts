import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { MongoClient } from "mongodb";
import { ZodError } from "zod";
import {
	type ResidentConfirmDto,
	type ResidentCreateDto,
	type ResidentUpdateDto,
	residentConfirmSchema,
	residentCreateSchema,
	residentUpdateSchema,
} from "./dto";
import { ResidentService } from "./resident.service";

export class ResidentController {
	private residentService: ResidentService;

	constructor(mongoClient: MongoClient) {
		this.residentService = new ResidentService(mongoClient);
	}

	public async createResident(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		try {
			const input = residentCreateSchema.parse(
				request.body,
			) as ResidentCreateDto;

			const resident = await this.residentService.createResident(input);

			const { presignedUrl, photoUrl, s3Key } =
				await this.residentService.generatePresignedUrl(resident.id, "jpg");

			return reply.status(httpStatus.CREATED).send({
				success: true,
				message:
					"Morador cadastrado com sucesso! Verifique seu email para confirmar o cadastro.",
				data: {
					id: resident.id,
					email: resident.email,
					apartmentNumber: resident.apartmentNumber,
					phone: resident.phone,
					status: resident.status,
					upload: {
						presignedUrl,
						photoUrl,
						s3Key,
						instructions:
							"Use a presignedUrl para fazer upload da foto via PUT request. Após o upload, atualize o morador com a photoUrl retornada.",
						expiresIn: `${process.env.AWS_S3_PRESIGNED_URL_EXPIRATION} segundos`,
					},
				},
			});
		} catch (error) {
			if (error instanceof ZodError) {
				return reply.status(httpStatus.BAD_REQUEST).send({
					success: false,
					message: "Dados inválidos",
					errors: error.errors.map((err) => ({
						field: err.path.join("."),
						message: err.message,
					})),
				});
			}

			if (
				error instanceof Error &&
				error.message.includes("Email já cadastrado")
			) {
				return reply.status(httpStatus.CONFLICT).send({
					success: false,
					message: error.message,
				});
			}

			console.error("Erro ao criar morador:", error);
			return reply.status(httpStatus.INTERNAL_SERVER_ERROR).send({
				success: false,
				message: "Erro ao criar morador",
			});
		}
	}

	public async getResident(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		try {
			const { id } = request.params as { id: string };

			const resident = await this.residentService.getResident(id);

			if (!resident) {
				return reply.status(httpStatus.NOT_FOUND).send({
					success: false,
					message: "Morador não encontrado",
				});
			}

			const { passwordHash, residentCode, ...residentData } = resident;

			return reply.status(httpStatus.OK).send({
				success: true,
				data: residentData,
			});
		} catch (error) {
			console.error("Erro ao buscar morador:", error);
			return reply.status(httpStatus.INTERNAL_SERVER_ERROR).send({
				success: false,
				message: "Erro ao buscar morador",
			});
		}
	}

	public async updateResident(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		try {
			const { id } = request.params as { id: string };
			const input = residentUpdateSchema.parse(
				request.body,
			) as ResidentUpdateDto;

			const resident = await this.residentService.updateResident(id, input);

			if (!resident) {
				return reply.status(httpStatus.NOT_FOUND).send({
					success: false,
					message: "Morador não encontrado",
				});
			}

			const { passwordHash, residentCode, ...residentData } = resident;

			return reply.status(httpStatus.OK).send({
				success: true,
				message: "Morador atualizado com sucesso",
				data: residentData,
			});
		} catch (error) {
			if (error instanceof ZodError) {
				return reply.status(httpStatus.BAD_REQUEST).send({
					success: false,
					message: "Dados inválidos",
					errors: error.errors.map((err) => ({
						field: err.path.join("."),
						message: err.message,
					})),
				});
			}

			console.error("Erro ao atualizar morador:", error);
			return reply.status(httpStatus.INTERNAL_SERVER_ERROR).send({
				success: false,
				message: "Erro ao atualizar morador",
			});
		}
	}

	public async deleteResident(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		try {
			const { id } = request.params as { id: string };

			const deleted = await this.residentService.deleteResident(id);

			if (!deleted) {
				return reply.status(httpStatus.NOT_FOUND).send({
					success: false,
					message: "Morador não encontrado",
				});
			}

			return reply.status(httpStatus.OK).send({
				success: true,
				message: "Morador deletado com sucesso",
			});
		} catch (error) {
			console.error("Erro ao deletar morador:", error);
			return reply.status(httpStatus.INTERNAL_SERVER_ERROR).send({
				success: false,
				message: "Erro ao deletar morador",
			});
		}
	}

public async confirmResident(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		try {
			const input = residentConfirmSchema.parse(
				request.body,
			) as ResidentConfirmDto;

			const result = await this.residentService.confirmResidentCode(
				input.email,
				input.code,
			);

			if (!result.success) {
				return reply.status(httpStatus.BAD_REQUEST).send({
					success: false,
					message: result.message,
				});
			}

			return reply.status(httpStatus.OK).send({
				success: true,
				message: result.message,
			});
		} catch (error) {
			if (error instanceof ZodError) {
				return reply.status(httpStatus.BAD_REQUEST).send({
					success: false,
					message: "Dados inválidos",
					errors: error.errors.map((err) => ({
						field: err.path.join("."),
						message: err.message,
					})),
				});
			}

			console.error("Erro ao confirmar morador:", error);
			return reply.status(httpStatus.INTERNAL_SERVER_ERROR).send({
				success: false,
				message: "Erro ao confirmar código",
			});
		}
	}

	public async generatePresignedUrl(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		try {
			const { id } = request.params as { id: string };
			const { fileExtension = "jpg" } = request.body as {
				fileExtension?: string;
			};

			const resident = await this.residentService.getResident(id);
			if (!resident) {
				return reply.status(httpStatus.NOT_FOUND).send({
					success: false,
					message: "Morador não encontrado",
				});
			}

			const { presignedUrl, photoUrl, s3Key } =
				await this.residentService.generatePresignedUrl(id, fileExtension);

			return reply.status(httpStatus.OK).send({
				success: true,
				data: {
					presignedUrl,
					photoUrl,
					s3Key,
					instructions:
						"Use a presignedUrl para fazer upload da foto via PUT request. Após o upload, atualize o morador com a photoUrl retornada.",
					expiresIn: `${process.env.AWS_S3_PRESIGNED_URL_EXPIRATION} segundos`,
				},
			});
		} catch (error) {
			console.error("Erro ao gerar URL pré-assinada:", error);
			return reply.status(httpStatus.INTERNAL_SERVER_ERROR).send({
				success: false,
				message: "Erro ao gerar URL pré-assinada",
			});
		}
	}
}
