import type { MongoClient } from "mongodb";
import type { ApartmentEntity } from "../../../database/mongodb/entity/apartment.entity";
import { ApartmentRepository } from "../../../database/mongodb/repositories/apartment.repository";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";

export class ApartmentService {
	private apartmentRepository: ApartmentRepository;

	constructor(mongoClient: MongoClient) {
		this.apartmentRepository = new ApartmentRepository(mongoClient);
	}

	public async getApartment(
		apartmentId: string,
	): Promise<HttpResponse<ApartmentEntity>> {
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
}
