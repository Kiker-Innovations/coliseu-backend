import { randomUUID } from "node:crypto";
import type { Collection, MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type {
	CreateApartmentEntity,
	ApartmentEntity,
	UpdateApartmentEntity,
} from "../entity/apartment.entity";
import type { IRepository } from "../interfaces/IRepository";
import { getDate } from "@/v1/utils/utils";

export class ApartmentRepository
	implements
		IRepository<ApartmentEntity, CreateApartmentEntity, UpdateApartmentEntity>
{
	private collection: Collection<ApartmentEntity>;

	constructor(mongoClient: MongoClient) {
		const database = mongoClient.db(env.databases.mongodb.database);
		this.collection = database.collection<ApartmentEntity>(
			env.databases.mongodb.collections.apartments,
		);
	}

	public async create(data: CreateApartmentEntity): Promise<ApartmentEntity> {
		const now = getDate();
		const apartmentEntity: ApartmentEntity = {
			_id: randomUUID(),
			...data,
			createdAt: now,
			updatedAt: now,
		};

		await this.collection.insertOne(apartmentEntity);
		return apartmentEntity;
	}

	public async findById(_id: string): Promise<ApartmentEntity | null> {
		return await this.collection.findOne({ _id });
	}

	public async findOne(
		filter: Partial<ApartmentEntity>,
	): Promise<ApartmentEntity | null> {
		return await this.collection.findOne(filter);
	}

	public async findMany(
		filter?: Partial<ApartmentEntity>,
	): Promise<ApartmentEntity[]> {
		return await this.collection.find(filter || {}).toArray();
	}

	public async update(
		_id: string,
		data: UpdateApartmentEntity,
	): Promise<ApartmentEntity | null> {
		const updateData = {
			...data,
			updatedAt: getDate(),
		};

		const result = await this.collection.findOneAndUpdate(
			{ _id },
			{ $set: updateData },
			{ returnDocument: "after" },
		);

		return result || null;
	}

	public async delete(_id: string): Promise<boolean> {
		const result = await this.collection.deleteOne({ _id });
		return result.deletedCount > 0;
	}

	public async findManyWithInfractionsAndResidents(
		buildingId: string,
		filter?: {
			apartmentId?: string;
			status?: string;
		},
	): Promise<
		Array<
			ApartmentEntity & {
				residents: Array<{
					_id: string;
					name: string;
					email: string;
					phone?: string;
				}>;
				infractions: Array<{
					_id: string;
					apartmentId: string;
					fineId: string;
					type: string;
					description: string;
					value: number;
					occurrenceDate: Date;
					status: string;
					createdAt: Date;
					updatedAt: Date;
					contextedAt?: Date;
					confirmedAt?: Date;
					paidAt?: Date;
					canceledAt?: Date;
					canceledNote?: string;
				}>;
			}
		>
	> {
		const infractionsCollection = this.collection.db.collection(
			env.databases.mongodb.collections.infractions,
		);
		const residentsCollection = this.collection.db.collection(
			env.databases.mongodb.collections.residents,
		);

		// Construir filtro de infractions
		const infractionFilter: any = {};
		if (filter?.apartmentId) {
			infractionFilter.apartmentId = filter.apartmentId;
		}
		if (filter?.status) {
			infractionFilter.status = filter.status;
		}

		// Buscar todos os apartamentos do building
		const apartments = await this.collection.find({ buildingId }).toArray();

		// Buscar todas as infractions que correspondem ao filtro
		const infractions = await infractionsCollection
			.find(infractionFilter)
			.toArray();

		// Buscar todos os residents
		const residents = await residentsCollection
			.find({
				apartmentId: { $in: apartments.map((apt) => apt._id) },
			})
			.toArray();

		// Agrupar residents por apartmentId
		const residentsByApartmentId = new Map<
			string,
			Array<{
				_id: string;
				name: string;
				email: string;
				phone?: string;
			}>
		>();

		residents.forEach((resident: any) => {
			const apartmentId = String(resident.apartmentId);
			if (!residentsByApartmentId.has(apartmentId)) {
				residentsByApartmentId.set(apartmentId, []);
			}
			residentsByApartmentId.get(apartmentId)!.push({
				_id: String(resident._id),
				name: String(resident.name),
				email: String(resident.email),
				phone: resident.phone ? String(resident.phone) : undefined,
			});
		});

		// Agrupar infractions por apartmentId
		const infractionsByApartmentId = new Map<string, Array<any>>();

		infractions.forEach((infraction: any) => {
			const apartmentId = String(infraction.apartmentId);
			if (!infractionsByApartmentId.has(apartmentId)) {
				infractionsByApartmentId.set(apartmentId, []);
			}
			infractionsByApartmentId.get(apartmentId)!.push({
				_id: String(infraction._id),
				apartmentId: String(infraction.apartmentId),
				fineId: String(infraction.fineId),
				type: String(infraction.type),
				description: String(infraction.description || ""),
				value: Number(infraction.value || 0),
				occurrenceDate:
					infraction.occurrenceDate instanceof Date
						? infraction.occurrenceDate
						: new Date(infraction.occurrenceDate),
				status: String(infraction.status),
				createdAt:
					infraction.createdAt instanceof Date
						? infraction.createdAt
						: new Date(infraction.createdAt),
				updatedAt:
					infraction.updatedAt instanceof Date
						? infraction.updatedAt
						: new Date(infraction.updatedAt),
				contextedAt: infraction.contextedAt
					? infraction.contextedAt instanceof Date
						? infraction.contextedAt
						: new Date(infraction.contextedAt)
					: undefined,
				confirmedAt: infraction.confirmedAt
					? infraction.confirmedAt instanceof Date
						? infraction.confirmedAt
						: new Date(infraction.confirmedAt)
					: undefined,
				paidAt: infraction.paidAt
					? infraction.paidAt instanceof Date
						? infraction.paidAt
						: new Date(infraction.paidAt)
					: undefined,
				canceledAt: infraction.canceledAt
					? infraction.canceledAt instanceof Date
						? infraction.canceledAt
						: new Date(infraction.canceledAt)
					: undefined,
				canceledNote: infraction.canceledNote
					? String(infraction.canceledNote)
					: undefined,
			});
		});

		// Se há filtro de apartmentId, retornar apenas esse apartamento
		// Caso contrário, retornar apenas apartamentos que têm infractions
		const apartmentsToReturn = filter?.apartmentId
			? apartments.filter((apt) => apt._id === filter.apartmentId)
			: apartments.filter((apt) => infractionsByApartmentId.has(apt._id));

		// Mapear apartamentos com residents e infractions
		return apartmentsToReturn.map((apartment) => ({
			...apartment,
			residents: residentsByApartmentId.get(apartment._id) || [],
			infractions: infractionsByApartmentId.get(apartment._id) || [],
		}));
	}
}
