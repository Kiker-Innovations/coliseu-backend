export class ApartmentSchema {
	public getAll = {
		response: {
			200: {
				description: "Apartamentos encontrados",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "array",
						items: {
							type: "object",
							properties: {
								_id: { type: "string" },
								buildingId: { type: "string" },
								number: { type: "string" },
								block: { type: "string" },
								floor: { type: "number" },
								status: { type: "string" },
								createdAt: { type: "string", format: "date-time" },
								updatedAt: { type: "string", format: "date-time" },
							},
						},
					},
				},
			},
		},
	};
}

