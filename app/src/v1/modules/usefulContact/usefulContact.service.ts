import type { MongoClient } from "mongodb";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";
import { UsefulContactRepository } from "../../../database/mongodb/repositories/usefulContact.repository";
import { BuildingRepository } from "../../../database/mongodb/repositories/building.repository";
import type { CreateUsefulContactEntity } from "../../../database/mongodb/entity/usefulContact.entity";
import type { UsefulContactCreateDto, UsefulContactUpdateDto } from "./dto";

export class UsefulContactService {
	private usefulContactRepository: UsefulContactRepository;
	private buildingRepository: BuildingRepository;

	constructor(mongoClient: MongoClient) {
		this.usefulContactRepository = new UsefulContactRepository(mongoClient);
		this.buildingRepository = new BuildingRepository(mongoClient);
	}

	public async createUsefulContact(
		usefulContactCreateDto: UsefulContactCreateDto,
		buildingId: string,
	): Promise<
		HttpResponse<{
			_id: string;
			name: string;
			phone: string;
			observation?: string;
			createdAt: Date;
		}>
	> {
		const building = await this.buildingRepository.findById(buildingId);

		if (!building) {
			throw httpException("Edifício não encontrado", httpStatus.NOT_FOUND);
		}

		const usefulContactEntity: CreateUsefulContactEntity = {
			buildingId,
			name: usefulContactCreateDto.name,
			phone: usefulContactCreateDto.phone,
			observation: usefulContactCreateDto.observation,
		};

		const createdContact =
			await this.usefulContactRepository.create(usefulContactEntity);

		return {
			success: true,
			message: "Contato útil cadastrado com sucesso",
			data: {
				_id: createdContact._id,
				name: createdContact.name,
				phone: createdContact.phone,
				observation: createdContact.observation,
				createdAt: createdContact.createdAt,
			},
		};
	}

	public async getUsefulContactsByBuilding(buildingId: string): Promise<
		HttpResponse<
			{
				_id: string;
				name: string;
				phone: string;
				observation?: string;
				createdAt: Date;
			}[]
		>
	> {
		const building = await this.buildingRepository.findById(buildingId);

		if (!building) {
			throw httpException("Edifício não encontrado", httpStatus.NOT_FOUND);
		}

		const contacts =
			await this.usefulContactRepository.findManyByBuildingId(buildingId);

		return {
			success: true,
			message: "Contatos úteis recuperados com sucesso",
			data: contacts.map((contact) => ({
				_id: contact._id,
				name: contact.name,
				phone: contact.phone,
				observation: contact.observation,
				createdAt: contact.createdAt,
			})),
		};
	}

	public async getUsefulContactById(contactId: string): Promise<
		HttpResponse<{
			_id: string;
			name: string;
			phone: string;
			observation?: string;
			createdAt: Date;
			updatedAt: Date;
		}>
	> {
		const contact = await this.usefulContactRepository.findById(contactId);

		if (!contact) {
			throw httpException("Contato útil não encontrado", httpStatus.NOT_FOUND);
		}

		return {
			success: true,
			message: "Contato útil recuperado com sucesso",
			data: {
				_id: contact._id,
				name: contact.name,
				phone: contact.phone,
				observation: contact.observation,
				createdAt: contact.createdAt,
				updatedAt: contact.updatedAt,
			},
		};
	}

	public async updateUsefulContact(
		contactId: string,
		usefulContactUpdateDto: UsefulContactUpdateDto,
	): Promise<
		HttpResponse<{
			_id: string;
			name: string;
			phone: string;
			observation?: string;
			updatedAt: Date;
		}>
	> {
		const contact = await this.usefulContactRepository.findById(contactId);

		if (!contact) {
			throw httpException("Contato útil não encontrado", httpStatus.NOT_FOUND);
		}

		const updatedContact = await this.usefulContactRepository.update(
			contactId,
			usefulContactUpdateDto,
		);

		if (!updatedContact) {
			throw httpException(
				"Erro ao atualizar contato útil",
				httpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		return {
			success: true,
			message: "Contato útil atualizado com sucesso",
			data: {
				_id: updatedContact._id,
				name: updatedContact.name,
				phone: updatedContact.phone,
				observation: updatedContact.observation,
				updatedAt: updatedContact.updatedAt,
			},
		};
	}

	public async deleteUsefulContact(
		contactId: string,
	): Promise<HttpResponse<void>> {
		const contact = await this.usefulContactRepository.findById(contactId);

		if (!contact) {
			throw httpException("Contato útil não encontrado", httpStatus.NOT_FOUND);
		}

		const deleted = await this.usefulContactRepository.delete(contactId);

		if (!deleted) {
			throw httpException(
				"Erro ao excluir contato útil",
				httpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		return {
			success: true,
			message: "Contato útil excluído com sucesso",
		};
	}
}
