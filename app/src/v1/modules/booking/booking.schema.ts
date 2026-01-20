export class BookingSchema {
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
										paymentId: { type: ["string", "null"] },
										paymentUrl: { type: ["string", "null"] },
										startDate: { type: ["string", "null"] },
										endDate: { type: ["string", "null"] },
										numberOfDays: { type: ["number", "null"] },
										status: { type: "string" },
										totalValue: { type: "number" },
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
		querystring: {
			type: "object",
			properties: {
				amenityId: {
					type: "string",
					description: "ID da comodidade para filtrar (opcional)",
				},
			},
		},
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
										paymentId: { type: ["string", "null"] },
										paymentUrl: { type: ["string", "null"] },
										startDate: { type: ["string", "null"] },
										endDate: { type: ["string", "null"] },
										numberOfDays: { type: ["number", "null"] },
										status: { type: "string" },
										totalValue: { type: "number" },
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

	public availability = {
		querystring: {
			type: "object",
			required: ["amenityId", "startDate", "endDate"],
			properties: {
				amenityId: {
					type: "string",
					description: "ID da comodidade (UUID)",
					example: "b2ce3bcd-6309-42a5-861c-33bdefb7ab33",
				},
				startDate: {
					type: "string",
					format: "date",
					description: "Data de início do período (YYYY-MM-DD)",
					example: "2024-01-01",
				},
				endDate: {
					type: "string",
					format: "date",
					description: "Data de término do período (YYYY-MM-DD)",
					example: "2024-01-31",
				},
			},
		},
		response: {
			200: {
				description: "Disponibilidade de dias calculada com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							amenityId: { type: "string" },
							startDate: { type: "string" },
							endDate: { type: "string" },
							days: {
								type: "array",
								items: {
									type: "object",
									properties: {
										date: {
											type: "string",
											description: "Data no formato YYYY-MM-DD",
										},
										available: {
											type: "boolean",
											description: "Se o dia está disponível",
										},
									},
								},
							},
						},
					},
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
			404: {
				description: "Comodidade não encontrada",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public hoursAvailability = {
		querystring: {
			type: "object",
			required: ["amenityId", "date"],
			properties: {
				amenityId: {
					type: "string",
					description: "ID da comodidade (UUID)",
					example: "b2ce3bcd-6309-42a5-861c-33bdefb7ab33",
				},
				date: {
					type: "string",
					format: "date",
					description: "Data para verificar disponibilidade de horas (YYYY-MM-DD)",
					example: "2024-01-15",
				},
			},
		},
		response: {
			200: {
				description: "Disponibilidade de horas calculada com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							amenityId: { type: "string" },
							date: { type: "string" },
							dayAvailable: {
								type: "boolean",
								description: "Se tem pelo menos uma hora disponível no dia",
							},
							hours: {
								type: "array",
								items: {
									type: "object",
									properties: {
										hour: {
											type: "number",
											description: "Hora do dia (0-23)",
										},
										available: {
											type: "boolean",
											description: "Se a hora está disponível",
										},
									},
								},
							},
						},
					},
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
			404: {
				description: "Comodidade não encontrada",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};
}

