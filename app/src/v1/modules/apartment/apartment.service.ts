import type { MongoClient } from "mongodb";
import type { ApartmentEntity } from "../../../database/mongodb/entity/apartment.entity";
import { ApartmentRepository } from "../../../database/mongodb/repositories/apartment.repository";
import type { HttpResponse } from "../../../interface/httpResponse.interface";

export class ApartmentService {
	private apartmentRepository: ApartmentRepository;

	constructor(mongoClient: MongoClient) {
		this.apartmentRepository = new ApartmentRepository(mongoClient);
	}

	public async getAllApartments(): Promise<HttpResponse<ApartmentEntity[]>> {
		const apartments = await this.apartmentRepository.findMany();

		return {
			success: true,
			message: "Apartamentos encontrados com sucesso",
			data: apartments,
		};
	}
}

