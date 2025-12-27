export class AmenityBookingSchema {
	public create = {
		body: {
			type: "object",
			required: ["amenityId", "startDate", "endDate", "totalValue"],
			properties: {
				amenityId: {
					type: "string",
					description: "ID da comodidade (UUID)",
					example: "123e4567-e89b-12d3-a456-426614174000",
				},
				startDate: {
					type: "string",
					format: "date-time",
					description: "Data e hora de início do agendamento (ISO 8601)",
					example: "2024-01-15T14:00:00Z",
				},
				endDate: {
					type: "string",
					format: "date-time",
					description: "Data e hora de término do agendamento (ISO 8601)",
					example: "2024-01-15T16:00:00Z",
				},
				totalValue: {
					type: "number",
					description: "Valor total do agendamento",
					example: 150.50,
				},
			},
		},
		response: {
			201: {
				description: "Agendamento criado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: { type: "object" },
				},
			},
			400: {
				description: "Dados inválidos",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public list = {
		querystring: {
			type: "object",
			properties: {
				page: { type: "number", description: "Número da página (padrão: 1)" },
				limit: { type: "number", description: "Itens por página (padrão: 10)" },
			},
		},
		response: {
			200: {
				description: "Lista de agendamentos",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							bookings: { type: "array", items: { type: "object" } },
							total: { type: "number" },
							page: { type: "number" },
							limit: { type: "number" },
						},
					},
				},
			},
		},
	};

	public cancel = {
		params: {
			type: "object",
			required: ["id"],
			properties: {
				id: {
					type: "string",
					description: "ID do agendamento",
				},
			},
		},
		response: {
			200: {
				description: "Agendamento cancelado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: { type: "object" },
				},
			},
			404: {
				description: "Agendamento não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public listByBuilding = {
		response: {
			200: {
				description: "Lista de agendamentos do edifício",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							bookings: { type: "array", items: { type: "object" } },
							total: { type: "number" },
						},
					},
				},
			},
			400: {
				description: "ID do edifício não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};
}

