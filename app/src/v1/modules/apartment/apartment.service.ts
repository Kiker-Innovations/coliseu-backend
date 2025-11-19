import type { MongoClient } from "mongodb";
import type {
	CreateApartmentEntity,
	ApartmentEntity,
} from "../../../database/mongodb/entity/apartment.entity";
import { ApartmentRepository } from "../../../database/mongodb/repositories/apartment.repository";
import type { ApartmentCreateDto, ApartmentUpdateDto } from "./dto";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";

export class ApartmentService {
	private apartmentRepository: ApartmentRepository;

	constructor(mongoClient: MongoClient) {
		this.apartmentRepository = new ApartmentRepository(mongoClient);
	}

	public async createApartment(apartmentCreateDto: ApartmentCreateDto): Promise<
		HttpResponse<{
			id: string;
			buildingId: string;
			number: string;
			block: string;
		}>
	> {
		const apartmentEntity: CreateApartmentEntity = {
			buildingId: apartmentCreateDto.buildingId,
			number: apartmentCreateDto.number,
			block: apartmentCreateDto.block,
			floor: apartmentCreateDto.floor,
			status: apartmentCreateDto.status,
		};

		const createdApartment = await this.apartmentRepository.create(apartmentEntity);

		return {
			success: true,
			message: "Apartamento cadastrado com sucesso!",
			data: {
				id: createdApartment._id,
				buildingId: createdApartment.buildingId,
				number: createdApartment.number,
				block: createdApartment.block,
			},
		};
	}

	public async getApartment(apartmentId: string): Promise<
		HttpResponse<ApartmentEntity>
	> {
		const apartment = await this.apartmentRepository.findById(apartmentId);

		if (!apartment) {
			throw httpException("Apartamento não encontrado", httpStatus.NOT_FOUND);
		}

		return {
			success: true,
			message: "Apartamento encontrado com sucesso",
			data: apartment,
		};
	}

	public async getAllApartmentsByBuilding(
		buildingId: string,
	): Promise<HttpResponse<ApartmentEntity[]>> {
		const apartments = await this.apartmentRepository.findMany({ buildingId });

		return {
			success: true,
			message: "Apartamentos encontrados com sucesso",
			data: apartments,
		};
	}

	public async updateApartment(
		apartmentId: string,
		apartmentUpdateDto: ApartmentUpdateDto,
	): Promise<HttpResponse<ApartmentEntity>> {
		const apartment = await this.apartmentRepository.findById(apartmentId);

		if (!apartment) {
			throw httpException("Apartamento não encontrado", httpStatus.NOT_FOUND);
		}

		const updatedApartment = await this.apartmentRepository.update(
			apartmentId,
			apartmentUpdateDto,
		);

		if (!updatedApartment) {
			throw httpException(
				"Erro ao atualizar apartamento",
				httpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		return {
			success: true,
			message: "Apartamento atualizado com sucesso",
			data: updatedApartment,
		};
	}

	public async deleteApartment(
		apartmentId: string,
	): Promise<HttpResponse<null>> {
		const apartment = await this.apartmentRepository.findById(apartmentId);

		if (!apartment) {
			throw httpException("Apartamento não encontrado", httpStatus.NOT_FOUND);
		}

		const deleted = await this.apartmentRepository.delete(apartmentId);

		if (!deleted) {
			throw httpException(
				"Erro ao deletar apartamento",
				httpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		return {
			success: true,
			message: "Apartamento deletado com sucesso",
			data: null,
		};
	}
}

