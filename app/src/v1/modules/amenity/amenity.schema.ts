export class AmenitySchema {
	public create = {
		body: {
			type: "object",
			required: ["buildingId", "name"],
			properties: {
				buildingId: {
					type: "string",
					description: "ID do edifício (UUID)",
					example: "b2ce3bcd-6309-42a5-861c-33bdefb7ab33",
				},
				name: {
					type: "string",
					description: "Nome da comodidade",
					example: "Piscina",
				},
				quantity: {
					type: "number",
					description: "Quantidade de comodidades",
					example: 2,
				},
				description: {
					type: "string",
					description: "Descrição da comodidade",
					example: "Piscinas adulto e infantil",
				},
				value: {
					type: "number",
					description: "Valor de uso (R$)",
					example: 0,
				},
				fineValue: {
					type: "number",
					description: "Valor da multa por atraso (R$)",
					example: 150,
				},
				nonComplianceFine: {
					type: "number",
					description: "Valor da multa por descumprimento de normas (R$)",
					example: 200,
				},
				maxResidents: {
					type: "number",
					description: "Quantidade Máxima de Residentes na comodidade",
					example: 10,
				},
				maxHours: {
					type: "number",
					description: "Limite de horas que podem ser agendadas para a comodidade",
					example: 4,
					maximum: 24,
				},
				usageRules: {
					type: "string",
					description: "Normas de uso da comodidade (HTML)",
					example: "<p>Normas de uso...</p>",
				},
				bookingType: {
					type: "string",
					enum: ["DIARIO", "POR_HORAS"],
					description: "Tipo de reserva (DIARIO ou POR_HORAS). Se POR_HORAS, maxHours é obrigatório",
					example: "DIARIO",
				},
				items: {
					type: "array",
					description: "Lista de itens da comodidade",
					items: {
						type: "object",
						properties: {
							name: {
								type: "string",
								description: "Nome do item",
								example: "Cadeira",
							},
							quantity: {
								type: "number",
								description: "Quantidade do item",
								example: 10,
							},
						},
					},
				},
				status: {
					type: "string",
					enum: ["ATIVO", "INATIVO"],
					description: "Status da comodidade (ATIVO ou INATIVO)",
					example: "ATIVO",
				},
			},
		},
		response: {
			201: {
				description: "Comodidade criada com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							id: { type: "string" },
							buildingId: { type: "string" },
							name: { type: "string" },
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
					errors: {
						type: "array",
						items: {
							type: "object",
							properties: {
								field: { type: "string" },
								message: { type: "string" },
							},
						},
					},
				},
			},
		},
	};

	public getById = {
		params: {
			type: "object",
			required: ["id"],
			properties: {
				id: {
					type: "string",
					description: "ID da comodidade",
				},
			},
		},
		response: {
			200: {
				description: "Comodidade encontrada",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							buildingId: { type: "string" },
							name: { type: "string" },
							description: { type: "string" },
							type: { type: "string" },
							value: { type: "number" },
							fineValue: { type: "number" },
							nonComplianceFine: { type: "number" },
							maxResidents: { type: "number" },
							usageRules: { type: "string" },
							bookingType: { type: "string" },
							maxHours: { type: "number" },
							openingTime: { type: "string" },
							closingTime: { type: "string" },
							items: {
								type: "array",
								items: {
									type: "object",
									properties: {
										name: { type: "string" },
										quantity: { type: "number" },
									},
								},
							},
							createdAt: { type: "string", format: "date-time" },
							updatedAt: { type: "string", format: "date-time" },
						},
					},
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

	public getAllByBuilding = {
		querystring: {
			type: "object",
			properties: {},
		},
		response: {
			200: {
				description: "Comodidades encontradas",
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
								name: { type: "string" },
								description: { type: "string" },
								type: { type: "string", enum: ["COMODIDADE", "AREA_COMUM"] },
								value: { type: "number" },
								fineValue: { type: "number" },
								nonComplianceFine: { type: "number" },
								maxResidents: { type: "number" },
								usageRules: { type: "string" },
								bookingType: { type: "string" },
								maxHours: { type: "number" },
								openingTime: { type: "string" },
								closingTime: { type: "string" },
								items: {
									type: "array",
									items: {
										type: "object",
										properties: {
											name: { type: "string" },
											quantity: { type: "number" },
										},
									},
								},
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

	public update = {
		params: {
			type: "object",
			required: ["id"],
			properties: {
				id: {
					type: "string",
					description: "ID da comodidade",
				},
			},
		},
		body: {
			type: "object",
			properties: {
				buildingId: {
					type: "string",
					description: "ID do edifício (UUID)",
					example: "b2ce3bcd-6309-42a5-861c-33bdefb7ab33",
				},
				name: {
					type: "string",
					description: "Nome da comodidade",
					example: "Piscina",
				},
				quantity: {
					type: "number",
					description: "Quantidade de comodidades",
					example: 2,
				},
				description: {
					type: "string",
					description: "Descrição da comodidade",
					example: "Piscinas adulto e infantil",
				},
				value: {
					type: "number",
					description: "Valor de uso (R$)",
					example: 0,
				},
				fineValue: {
					type: "number",
					description: "Valor da multa por atraso (R$)",
					example: 150,
				},
				nonComplianceFine: {
					type: "number",
					description: "Valor da multa por descumprimento de normas (R$)",
					example: 200,
				},
				maxResidents: {
					type: "number",
					description: "Quantidade Máxima de Residentes na comodidade",
					example: 10,
				},
				maxHours: {
					type: "number",
					description: "Limite de horas que podem ser agendadas para a comodidade",
					example: 4,
					maximum: 24,
				},
				usageRules: {
					type: "string",
					description: "Normas de uso da comodidade (HTML)",
					example: "<p>Normas de uso...</p>",
				},
				bookingType: {
					type: "string",
					enum: ["DIARIO", "POR_HORAS"],
					description: "Tipo de reserva (DIARIO ou POR_HORAS). Se POR_HORAS, maxHours é obrigatório",
					example: "DIARIO",
				},
				openingTime: {
					type: "string",
					description: "Horário de abertura (formato HH:mm, ex: 08:00)",
					example: "08:00",
				},
				closingTime: {
					type: "string",
					description: "Horário de fechamento (formato HH:mm, ex: 22:00)",
					example: "22:00",
				},
				items: {
					type: "array",
					description: "Lista de itens da comodidade",
					items: {
						type: "object",
						properties: {
							name: {
								type: "string",
								description: "Nome do item",
								example: "Cadeira",
							},
							quantity: {
								type: "number",
								description: "Quantidade do item",
								example: 10,
							},
						},
					},
				},
				status: {
					type: "string",
					enum: ["ATIVO", "INATIVO"],
					description: "Status da comodidade (ATIVO ou INATIVO)",
					example: "ATIVO",
				},
			},
		},
		response: {
			200: {
				description: "Comodidade atualizada com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							buildingId: { type: "string" },
							name: { type: "string" },
							description: { type: "string" },
							type: { type: "string", enum: ["COMODIDADE", "AREA_COMUM"] },
							value: { type: "number" },
							fineValue: { type: "number" },
							nonComplianceFine: { type: "number" },
							maxResidents: { type: "number" },
							usageRules: { type: "string" },
							bookingType: { type: "string" },
							maxHours: { type: "number" },
							openingTime: { type: "string" },
							closingTime: { type: "string" },
							status: { type: "string" },
							createdAt: { type: "string", format: "date-time" },
							updatedAt: { type: "string", format: "date-time" },
						},
					},
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

	public remove = {
		params: {
			type: "object",
			required: ["id"],
			properties: {
				id: {
					type: "string",
					description: "ID da comodidade",
				},
			},
		},
		response: {
			200: {
				description: "Comodidade deletada com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: { type: "null" },
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

	public countByBuilding = {
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
				description: "Contagem de comodidades",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: { type: "number" },
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

	public getActiveCommoditiesForResident = {
		querystring: {
			type: "object",
			properties: {},
		},
		response: {
			200: {
				description: "Comodidades ativas encontradas",
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
								name: { type: "string" },
								description: { type: "string" },
								type: { type: "string", enum: ["COMODIDADE", "AREA_COMUM"] },
								value: { type: "number" },
								fineValue: { type: "number" },
								nonComplianceFine: { type: "number" },
								maxResidents: { type: "number" },
								usageRules: { type: "string" },
								bookingType: { type: "string" },
								maxHours: { type: "number" },
								openingTime: { type: "string" },
								closingTime: { type: "string" },
								items: {
									type: "array",
									items: {
										type: "object",
										properties: {
											name: { type: "string" },
											quantity: { type: "number" },
										},
									},
								},
								status: { type: "string" },
								createdAt: { type: "string", format: "date-time" },
								updatedAt: { type: "string", format: "date-time" },
							},
						},
					},
				},
			},
			403: {
				description: "Acesso negado - apenas para residentes",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			400: {
				description: "ID do edifício não encontrado no token",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};
}
