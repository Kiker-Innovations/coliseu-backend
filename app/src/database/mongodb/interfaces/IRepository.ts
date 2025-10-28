export interface IRepository<
	T,
	CreateDTO = Partial<T>,
	UpdateDTO = Partial<T>,
> {
	create(data: CreateDTO): Promise<T>;
	findById(id: string): Promise<T | null>;
	findOne(filter: Partial<T>): Promise<T | null>;
	findMany(filter?: Partial<T>): Promise<T[]>;
	update(id: string, data: UpdateDTO): Promise<T | null>;
	delete(id: string): Promise<boolean>;
}
