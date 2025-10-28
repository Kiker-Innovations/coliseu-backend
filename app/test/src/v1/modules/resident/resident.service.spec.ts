import { randomUUID } from "node:crypto";
import type { MongoClient } from "mongodb";
import { ResidentStatusEnum } from "../../../../../src/v1/enum/residentStatus.enum";
import type { ResidentEntity } from "../../../../../src/database/mongodb/entity/resident.entity";
import { ResidentService } from "../../../../../src/v1/modules/resident/resident.service";
import type { ResidentRepository } from "../../../../../src/database/mongodb/repositories/resident.repository";

// Mock do env
jest.mock("../../../../../src/config/env", () => ({
	env: {
		app: {
			port: 3000,
			environment: "test",
			baseUrl: "http://localhost:3000",
			jwtSecret: "test-secret",
		},
		plugins: {
			swagger: {
				basePath: "/",
			},
		},
		stripPrefix: {
			path: "/api/test",
		},
		databases: {
			mongodb: {
				url: "mongodb://localhost:27017/test",
				collections: {
					residents: "residents",
				},
			},
		},
		providers: {
			aws: {
				config: {
					region: "us-east-1",
					accessKeyId: "test-key",
					secretAccessKey: "test-secret",
				},
				s3: {
					bucketName: "test-bucket",
					presignedUrlExpiration: 3600,
					folders: {
						resident: "residents",
					},
				},
				ses: {
					fromEmail: "test@example.com",
				},
			},
		},
	},
}));

// Mock do ResidentRepository
jest.mock(
	"../../../../../src/database/mongodb/repositories/resident.repository",
);

// Mock dos providers AWS
jest.mock("../../../../../src/providers/aws/s3.provider", () => ({
	S3Provider: jest.fn().mockImplementation(() => ({
		getPresignedUrlForPut: jest
			.fn()
			.mockResolvedValue("https://mock-presigned-url"),
		getPublicUrl: jest
			.fn()
			.mockReturnValue("https://mock-public-url/residents/test.jpg"),
	})),
}));

jest.mock("../../../../../src/providers/aws/ses.provider", () => ({
	SESProvider: jest.fn().mockImplementation(() => ({
		sendConfirmationEmail: jest.fn().mockResolvedValue("mock-message-id"),
	})),
}));

describe("ResidentService", () => {
	let residentService: ResidentService;
	let mockRepository: jest.Mocked<ResidentRepository>;
	let mockMongoClient: jest.Mocked<MongoClient>;

	beforeEach(() => {
		// Mock do MongoClient
		// biome-ignore lint/suspicious/noExplicitAny: Mock para testes
		mockMongoClient = {
			db: jest.fn().mockReturnValue({
				collection: jest.fn(),
			}),
		} as any;

		residentService = new ResidentService(mockMongoClient);

		// biome-ignore lint/suspicious/noExplicitAny: Mock para testes
		mockRepository = (residentService as any)
			.residentRepository as jest.Mocked<ResidentRepository>;
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe("createResident", () => {
		it("deve criar um novo morador com sucesso", async () => {
			const input = {
				apartmentNumber: "1234",
				email: "test@example.com",
				password: "Senha@123",
				phone: "+5513974080222",
			};

			const mockCreatedResident: ResidentEntity = {
				id: randomUUID(),
				apartmentNumber: input.apartmentNumber,
				email: input.email,
				passwordHash: "hashed-password",
				phone: input.phone,
				status: ResidentStatusEnum.INATIVO,
				photoUrl: null,
				residentCode: "ABC123",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockRepository.findByEmail = jest.fn().mockResolvedValue(null);
			mockRepository.create = jest.fn().mockResolvedValue(mockCreatedResident);

			const result = await residentService.createResident(input);

			expect(result).toHaveProperty("id");
			expect(result.email).toBe(input.email);
			expect(result.apartmentNumber).toBe(input.apartmentNumber);
			expect(result.phone).toBe(input.phone);
			expect(result.status).toBe(ResidentStatusEnum.INATIVO);
			expect(result.photoUrl).toBeNull();
			expect(result.residentCode).toBeDefined();
			expect(mockRepository.create).toHaveBeenCalled();
		});

		it("deve lançar erro se email já existir", async () => {
			const input = {
				apartmentNumber: "1234",
				email: "existing@example.com",
				password: "Senha@123",
				phone: "+5513974080222",
			};

			// biome-ignore lint/suspicious/noExplicitAny: Mock para testes
			mockRepository.findByEmail = jest.fn().mockResolvedValue({
				id: randomUUID(),
				email: input.email,
			} as any);

			await expect(residentService.createResident(input)).rejects.toThrow(
				"Email já cadastrado no sistema",
			);
			expect(mockRepository.create).not.toHaveBeenCalled();
		});
	});

	describe("getResident", () => {
		it("deve retornar um morador por ID", async () => {
			const mockResident: ResidentEntity = {
				id: randomUUID(),
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

			mockRepository.findById = jest.fn().mockResolvedValue(mockResident);

			const result = await residentService.getResident(mockResident.id);

			expect(result).toEqual(mockResident);
			expect(mockRepository.findById).toHaveBeenCalledWith(mockResident.id);
		});

		it("deve retornar null se morador não existir", async () => {
			mockRepository.findById = jest.fn().mockResolvedValue(null);

			const result = await residentService.getResident("non-existent-id");

			expect(result).toBeNull();
		});
	});

	describe("updateResident", () => {
		it("deve atualizar dados do morador", async () => {
			const residentId = randomUUID();
			const updateData = {
				phone: "+5513988887777",
				photoUrl: "https://example.com/photo.jpg",
			};

			const updatedResident: ResidentEntity = {
				id: residentId,
				apartmentNumber: "1234",
				email: "test@example.com",
				passwordHash: "hash",
				phone: updateData.phone,
				status: ResidentStatusEnum.VALIDADO,
				photoUrl: updateData.photoUrl,
				residentCode: "ABC123",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockRepository.update = jest.fn().mockResolvedValue(updatedResident);

			const result = await residentService.updateResident(
				residentId,
				updateData,
			);

			expect(result).toEqual(updatedResident);
			expect(mockRepository.update).toHaveBeenCalledWith(
				residentId,
				updateData,
			);
		});
	});

	describe("deleteResident", () => {
		it("deve deletar um morador com sucesso", async () => {
			mockRepository.delete = jest.fn().mockResolvedValue(true);

			const result = await residentService.deleteResident("test-id");

			expect(result).toBe(true);
			expect(mockRepository.delete).toHaveBeenCalledWith("test-id");
		});

		it("deve retornar false se morador não existir", async () => {
			mockRepository.delete = jest.fn().mockResolvedValue(false);

			const result = await residentService.deleteResident("non-existent-id");

			expect(result).toBe(false);
		});
	});

	describe("confirmResidentCode", () => {
		it("deve confirmar código e atualizar status para VALIDADO", async () => {
			const mockResident: ResidentEntity = {
				id: randomUUID(),
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

			mockRepository.findByEmail = jest.fn().mockResolvedValue(mockResident);
			mockRepository.updateByEmail = jest.fn().mockResolvedValue({
				...mockResident,
				status: ResidentStatusEnum.VALIDADO,
			});

			const result = await residentService.confirmResidentCode(
				"test@example.com",
				"ABC123",
			);

			expect(result.success).toBe(true);
			expect(result.message).toContain("confirmado com sucesso");
			expect(mockRepository.updateByEmail).toHaveBeenCalledWith(
				"test@example.com",
				{ status: ResidentStatusEnum.VALIDADO },
			);
		});

		it("deve retornar erro se código for inválido", async () => {
			const mockResident: ResidentEntity = {
				id: randomUUID(),
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

			mockRepository.findByEmail = jest.fn().mockResolvedValue(mockResident);

			const result = await residentService.confirmResidentCode(
				"test@example.com",
				"WRONG",
			);

			expect(result.success).toBe(false);
			expect(result.message).toContain("inválido");
			expect(mockRepository.updateByEmail).not.toHaveBeenCalled();
		});

		it("deve retornar erro se morador não existir", async () => {
			mockRepository.findByEmail = jest.fn().mockResolvedValue(null);

			const result = await residentService.confirmResidentCode(
				"nonexistent@example.com",
				"ABC123",
			);

			expect(result.success).toBe(false);
			expect(result.message).toContain("não encontrado");
		});
	});

	describe("generatePresignedUrl", () => {
		it("deve gerar URL pré-assinada para upload", async () => {
			const residentId = randomUUID();
			const result = await residentService.generatePresignedUrl(
				residentId,
				"jpg",
			);

			expect(result).toHaveProperty("presignedUrl");
			expect(result).toHaveProperty("photoUrl");
			expect(result).toHaveProperty("s3Key");
			expect(result.presignedUrl).toBe("https://mock-presigned-url");
			expect(result.s3Key).toContain(residentId);
		});
	});
});
