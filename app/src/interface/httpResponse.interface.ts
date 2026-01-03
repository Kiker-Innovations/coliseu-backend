export interface HttpResponse<T> {
	success: boolean;
	message: string | string[];
	data: T;
}
