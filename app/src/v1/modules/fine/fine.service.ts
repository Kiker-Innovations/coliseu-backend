import type { MongoClient } from "mongodb";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";
import { FineRepository } from "../../../database/mongodb/repositories/fine.repository";
import type { CreateFineEntity } from "../../../database/mongodb/entity/fine.entity";
import type { FineCreateDto, FineUpdateDto } from "./dto";

export class FineService {
	private fineRepository: FineRepository;

	constructor(mongoClient: MongoClient) {
		this.fineRepository = new FineRepository(mongoClient);
	}

	public async createFine(
		fineCreateDto: FineCreateDto
	): Promise<
		HttpResponse<{
			_id: string;
			name: string;
			description: string;
			value: number;
			createdAt: Date;
		}>
	> {
		const fineEntity: CreateFineEntity = {
			buildingId: fineCreateDto.buildingId,
			name: fineCreateDto.name,
			description: fineCreateDto.description,
			value: fineCreateDto.value,
		};

		const createdFine = await this.fineRepository.create(fineEntity);

		return {
			success: true,
			message: "Multa criada com sucesso!",
			data: {
				_id: createdFine._id,
				name: createdFine.name,
				description: createdFine.description,
				value: createdFine.value,
				createdAt: createdFine.createdAt,
			},
		};
	}

	public async deleteFine(fineId: string): Promise<HttpResponse<null>> {
		const fine = await this.fineRepository.findById(fineId);

		if (!fine) {
			throw httpException("Multa não encontrada", httpStatus.NOT_FOUND);
		}

		const deleted = await this.fineRepository.delete(fineId);

		if (!deleted) {
			throw httpException(
				"Erro ao deletar multa",
				httpStatus.INTERNAL_SERVER_ERROR
			);
		}

		return {
			success: true,
			message: "Multa deletada com sucesso",
			data: null,
		};
	}

	public async getAllFines(buildingId?: string): Promise<
		HttpResponse<
			Array<{
				_id: string;
				buildingId: string;
				name: string;
				description: string;
				value: number;
				createdAt: Date;
				updatedAt: Date;
			}>
		>
	> {
		const filter = buildingId ? { buildingId } : undefined;
		const fines = await this.fineRepository.findMany(filter);

		return {
			success: true,
			message: "Multas encontradas com sucesso",
			data: fines.map((fine) => ({
				_id: fine._id,
				buildingId: fine.buildingId,
				name: fine.name,
				description: fine.description,
				value: fine.value,
				createdAt: fine.createdAt,
				updatedAt: fine.updatedAt,
			})),
		};
	}

	public async updateFine(
		fineId: string,
		fineUpdateDto: FineUpdateDto
	): Promise<
		HttpResponse<{
			_id: string;
			buildingId: string;
			name: string;
			description: string;
			value: number;
			createdAt: Date;
			updatedAt: Date;
		}>
	> {
		const fine = await this.fineRepository.findById(fineId);

		if (!fine) {
			throw httpException("Multa não encontrada", httpStatus.NOT_FOUND);
		}

		const updatedFine = await this.fineRepository.update(
			fineId,
			fineUpdateDto
		);

		if (!updatedFine) {
			throw httpException(
				"Erro ao atualizar multa",
				httpStatus.INTERNAL_SERVER_ERROR
			);
		}

		return {
			success: true,
			message: "Multa atualizada com sucesso",
			data: {
				_id: updatedFine._id,
				buildingId: updatedFine.buildingId,
				name: updatedFine.name,
				description: updatedFine.description,
				value: updatedFine.value,
				createdAt: updatedFine.createdAt,
				updatedAt: updatedFine.updatedAt,
			},
		};
	}
}
