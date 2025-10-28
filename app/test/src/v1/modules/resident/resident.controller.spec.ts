import type { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import { randomUUID } from "node:crypto";
import { ResidentStatusEnum } from "../../../../../src/v1/enum/residentStatus.enum";
import { ResidentController } from "../../../../../src/v1/modules/resident/resident.controller";
import type { ResidentEntity } from "../../../../../src/database/mongodb/entity/resident.entity";

// Mock do ResidentService
const mockResidentService = {
	createResident: jest.fn(),
	getResident: jest.fn(),
	updateResident: jest.fn(),
	deleteResident: jest.fn(),
	confirmResidentCode: jest.fn(),
	generatePresignedUrl: jest.fn(),
};

jest.mock("../../../../../src/v1/modules/resident/resident.service", () => ({
	ResidentService: jest.fn().mockImplementation(() => mockResidentService),
}));

describe("ResidentController", () => {
	let residentController: ResidentController;
	let mockRequest: Partial<FastifyRequest>;
	let mockReply: Partial<FastifyReply>;

	beforeEach(() => {
		// biome-ignore lint/suspicious/noExplicitAny: Mock para testes
		const mockMongoClient = {} as any;
		residentController = new ResidentController(mockMongoClient);

		mockReply = {
			status: jest.fn().mockReturnThis(),
			send: jest.fn().mockReturnThis(),
		};

		mockRequest = {
			body: {},
			params: {},
		};
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe("createResident", () => {
		it("deve criar um morador com sucesso", async () => {
			const residentId = randomUUID();
			const mockResident: ResidentEntity = {
				id: residentId,
				apartmentNumber: "1234",
				email: "test@example.com",
				passwordHash: "hash",
				phone: "+5513974080222",
				status: ResidentStatusEnum.INATIVO,
				photoUrl: null,
				residentCode: "ABC123",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockRequest.body = {
				apartmentNumber: "1234",
				email: "test@example.com",
				password: "Senha@123",
				phone: "+5513974080222",
			};

			mockResidentService.createResident.mockResolvedValue(mockResident);
			mockResidentService.generatePresignedUrl.mockResolvedValue({
				presignedUrl: "https://presigned.url",
				photoUrl: "https://public.url",
				s3Key: "residents/test/photo.jpg",
			});

			await residentController.createResident(
				mockRequest as FastifyRequest,
				mockReply as FastifyReply,
			);

			expect(mockReply.status).toHaveBeenCalledWith(httpStatus.CREATED);
			expect(mockReply.send).toHaveBeenCalledWith(
				expect.objectContaining({
					success: true,
					message: expect.any(String),
					data: expect.objectContaining({
						id: residentId,
						email: "test@example.com",
					}),
				}),
			);
		});
	});

	describe("getResident", () => {
		it("deve retornar um morador por ID", async () => {
			const residentId = randomUUID();
			const mockResident: ResidentEntity = {
				id: residentId,
				apartmentNumber: "1234",
				email: "test@example.com",
				passwordHash: "hash",
				phone: "+5513974080222",
				status: ResidentStatusEnum.VALIDADO,
				photoUrl: null,
				residentCode: "ABC123",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockRequest.params = { id: residentId };
			mockResidentService.getResident.mockResolvedValue(mockResident);

			await residentController.getResident(
				mockRequest as FastifyRequest,
				mockReply as FastifyReply,
			);

			expect(mockReply.status).toHaveBeenCalledWith(httpStatus.OK);
			expect(mockReply.send).toHaveBeenCalledWith(
				expect.objectContaining({
					success: true,
					data: expect.not.objectContaining({
						passwordHash: expect.anything(),
						residentCode: expect.anything(),
					}),
				}),
			);
		});

		it("deve retornar 404 se morador não for encontrado", async () => {
			mockRequest.params = { id: "non-existent-id" };
			mockResidentService.getResident.mockResolvedValue(null);

			await residentController.getResident(
				mockRequest as FastifyRequest,
				mockReply as FastifyReply,
			);

			expect(mockReply.status).toHaveBeenCalledWith(httpStatus.NOT_FOUND);
			expect(mockReply.send).toHaveBeenCalledWith(
				expect.objectContaining({
					success: false,
					message: "Morador não encontrado",
				}),
			);
		});
	});

	describe("confirmResident", () => {
		it("deve confirmar código com sucesso", async () => {
			mockRequest.body = {
				email: "test@example.com",
				code: "ABC123",
			};

			mockResidentService.confirmResidentCode.mockResolvedValue({
				success: true,
				message: "Cadastro confirmado com sucesso!",
			});

			await residentController.confirmResident(
				mockRequest as FastifyRequest,
				mockReply as FastifyReply,
			);

			expect(mockReply.status).toHaveBeenCalledWith(httpStatus.OK);
			expect(mockReply.send).toHaveBeenCalledWith(
				expect.objectContaining({
					success: true,
					message: expect.stringContaining("sucesso"),
				}),
			);
		});

		it("deve retornar erro para código inválido", async () => {
			mockRequest.body = {
				email: "test@example.com",
				code: "WRONG",
			};

			mockResidentService.confirmResidentCode.mockResolvedValue({
				success: false,
				message: "Código de confirmação inválido",
			});

			await residentController.confirmResident(
				mockRequest as FastifyRequest,
				mockReply as FastifyReply,
			);

			expect(mockReply.status).toHaveBeenCalledWith(httpStatus.BAD_REQUEST);
			expect(mockReply.send).toHaveBeenCalledWith(
				expect.objectContaining({
					success: false,
					message: expect.stringContaining("inválido"),
				}),
			);
		});
	});

	describe("deleteResident", () => {
		it("deve deletar um morador com sucesso", async () => {
			mockRequest.params = { id: randomUUID() };
			mockResidentService.deleteResident.mockResolvedValue(true);

			await residentController.deleteResident(
				mockRequest as FastifyRequest,
				mockReply as FastifyReply,
			);

			expect(mockReply.status).toHaveBeenCalledWith(httpStatus.OK);
			expect(mockReply.send).toHaveBeenCalledWith(
				expect.objectContaining({
					success: true,
					message: "Morador deletado com sucesso",
				}),
			);
		});
	});
});
