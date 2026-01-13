export class ApartmentSchema {
	public getById = {
		params: {
			type: "object",
			required: ["id"],
			properties: {
				id: {
					type: "string",
					description: "ID do apartamento",
				},
			},
		},
		response: {
			200: {
				description: "Apartamento encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
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
			404: {
				description: "Apartamento não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public getAllByBuilding = {
		querystring: {
			type: "object",
			required: ["buildingId"],
			properties: {
				buildingId: {
					type: "string",
					description: "ID do edifício (UUID)",
					example: "b2ce3bcd-6309-42a5-861c-33bdefb7ab33",
				},
			},
		},
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
			400: {
				description: "buildingId não fornecido",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};
}
