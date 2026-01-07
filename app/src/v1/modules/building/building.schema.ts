export class BuildingSchema {
	public getById = {
		params: {
			type: "object",
			required: ["id"],
			properties: {
				id: {
					type: "string",
					description: "ID do edifício",
				},
			},
		},
		response: {
			200: {
				description: "Edifício encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							name: { type: "string" },
							cnpj: { type: "string" },
							state: { type: "string" },
							city: { type: "string" },
							address: { type: "string" },
							addressNumber: { type: "number" },
							zipCode: { type: "string" },
							complement: { type: "string" },
							phone: { type: "string" },
							floorCount: { type: "number" },
							createdAt: { type: "string", format: "date-time" },
							updatedAt: { type: "string", format: "date-time" },
						},
					},
				},
			},
			404: {
				description: "Edifício não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public getAll = {
		response: {
			200: {
				description: "Edifícios encontrados",
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
								name: { type: "string" },
								cnpj: { type: "string" },
								state: { type: "string" },
								city: { type: "string" },
								address: { type: "string" },
								addressNumber: { type: "number" },
								zipCode: { type: "string" },
								complement: { type: "string" },
								phone: { type: "string" },
								floorCount: { type: "number" },
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
