export class AmenityBookingSchema {
	public create = {
		body: {
			type: "object",
			required: ["amenityId", "startDate"],
			properties: {
				amenityId: {
					type: "string",
					description: "ID da comodidade (UUID)",
					example: "b2ce3bcd-6309-42a5-861c-33bdefb7ab33",
				},
				startDate: {
					type: "string",
					format: "date-time",
					description: "Data de início da reserva (ISO 8601)",
					example: "2024-01-15T00:00:00Z",
				},
				endDate: {
					type: "string",
					format: "date-time",
					description:
						"Data de término da reserva (ISO 8601) - obrigatório para DIARIO",
					example: "2024-01-15T23:59:59Z",
				},
				observation: {
					type: "string",
					description: "Observação opcional da reserva",
					example: "Observação sobre a reserva",
				},
			},
		},
		response: {
			201: {
				description: "Reserva criada com sucesso",
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
				description: "Lista de reservas",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							bookings: {
								type: "array",
								items: {
									type: "object",
									properties: {
										_id: { type: "string" },
										amenityId: { type: "string" },
										apartmentId: { type: "string" },
										residentId: { type: ["string", "null"] },
										startDate: { type: ["string", "null"] },
										endDate: { type: ["string", "null"] },
										numberOfDays: { type: ["number", "null"] },
										status: { type: "string" },
										totalValue: { type: "number" },
										qrCode: { type: ["string", "null"] },
										qrCodeExpiry: { type: ["string", "null"] },
										observation: { type: ["string", "null"] },
										createdAt: { type: ["string", "null"] },
										updatedAt: { type: ["string", "null"] },
										amenity: {
											type: ["object", "null"],
											properties: {
												_id: { type: "string" },
												name: { type: "string" },
												description: { type: ["string", "null"] },
												type: { type: ["string", "null"] },
												value: { type: ["number", "null"] },
												fineValue: { type: ["number", "null"] },
												maxResidents: { type: ["number", "null"] },
												bookingType: { type: ["string", "null"] },
											},
										},
									},
								},
							},
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
					description: "ID da reserva",
				},
			},
		},
		response: {
			200: {
				description: "Reserva cancelada",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: { type: "object" },
				},
			},
			404: {
				description: "Reserva não encontrada",
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
				description: "Lista de reservas do edifício",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							bookings: {
								type: "array",
								items: {
									type: "object",
									properties: {
										_id: { type: "string" },
										amenityId: { type: "string" },
										apartmentId: { type: "string" },
										residentId: { type: ["string", "null"] },
										startDate: { type: ["string", "null"] },
										endDate: { type: ["string", "null"] },
										numberOfDays: { type: ["number", "null"] },
										status: { type: "string" },
										totalValue: { type: "number" },
										qrCode: { type: ["string", "null"] },
										qrCodeExpiry: { type: ["string", "null"] },
										observation: { type: ["string", "null"] },
										createdAt: { type: ["string", "null"] },
										updatedAt: { type: ["string", "null"] },
										amenity: {
											type: ["object", "null"],
											properties: {
												_id: { type: "string" },
												name: { type: "string" },
												description: { type: ["string", "null"] },
												type: { type: ["string", "null"] },
												bookingType: { type: ["string", "null"] },
												maxHours: { type: ["number", "null"] },
											},
										},
										apartment: {
											type: ["object", "null"],
											properties: {
												_id: { type: "string" },
												number: { type: "string" },
												floor: { type: ["number", "null"] },
												block: { type: ["string", "null"] },
											},
										},
										resident: {
											type: ["object", "null"],
											properties: {
												_id: { type: "string" },
												name: { type: "string" },
												email: { type: "string" },
											},
										},
									},
								},
							},
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
