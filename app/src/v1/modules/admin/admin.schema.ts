import {
	protectedSchema,
	unauthorizedResponse,
	forbiddenResponse,
} from "../../utils/schemaHelper";

export class AdminSchema {
	public getById = {
		params: {
			type: "object",
			required: ["id"],
			properties: {
				id: {
					type: "string",
					description: "ID do administrador",
				},
			},
		},
		response: {
			200: {
				description: "Administrador encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							name: { type: "string" },
							email: { type: "string" },
							status: {
								type: "string",
								description: "Status do administrador (INATIVO, ATIVO)",
							},
						},
					},
				},
			},
			404: {
				description: "Administrador não encontrado",
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
					description: "ID do administrador",
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
					description: "Nome completo do administrador",
					example: "João Silva",
				},
			},
		},
		response: {
			200: {
				description: "Administrador atualizado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							name: { type: "string" },
							email: { type: "string" },
							status: {
								type: "string",
								description: "Status do administrador (INATIVO, ATIVO)",
							},
						},
					},
				},
			},
			404: {
				description: "Administrador não encontrado",
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
					description: "ID do administrador",
				},
			},
		},
		response: {
			200: {
				description: "Administrador deletado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: { type: "null" },
				},
			},
			404: {
				description: "Administrador não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public confirm = {
		body: {
			type: "object",
			required: ["email", "code"],
			properties: {
				email: {
					type: "string",
					description: "Email do administrador",
					example: "admin@example.com",
				},
				code: {
					type: "string",
					description: "Código de confirmação recebido por email",
					example: "ABC123",
				},
			},
		},
		response: {
			200: {
				description: "Código confirmado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: { type: "null" },
				},
			},
			400: {
				description: "Código inválido ou administrador não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public forgetPassword = {
		body: {
			type: "object",
			required: ["email"],
			properties: {
				email: {
					type: "string",
					description: "Email do administrador",
					example: "admin@example.com",
				},
			},
		},
		response: {
			200: {
				description: "Código de recuperação enviado para o email",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: { type: "null" },
				},
			},
			404: {
				description: "Email não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public changePassword = protectedSchema({
		body: {
			type: "object",
			required: ["currentPassword", "newPassword", "confirmPassword"],
			properties: {
				currentPassword: {
					type: "string",
					description: "Senha atual do administrador",
				},
				newPassword: {
					type: "string",
					description:
						"Nova senha (mínimo 8 caracteres, com maiúscula, minúscula e caractere especial)",
					minLength: 8,
				},
				confirmPassword: {
					type: "string",
					description: "Confirmação da nova senha",
				},
			},
		},
		response: {
			200: {
				description: "Senha alterada com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: { type: "null" },
				},
			},
			401: {
				description: "Senha atual incorreta",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			404: {
				description: "Administrador não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			...unauthorizedResponse,
			...forbiddenResponse,
		},
	});

	public resetPassword = {
		body: {
			type: "object",
			required: ["email", "code", "newPassword"],
			properties: {
				email: {
					type: "string",
					description: "Email do administrador",
					example: "admin@example.com",
				},
				code: {
					type: "string",
					description: "Código de recuperação de 6 dígitos recebido por email",
					example: "123456",
				},
				newPassword: {
					type: "string",
					description:
						"Nova senha (mínimo 8 caracteres, com maiúscula, minúscula e caractere especial)",
					example: "NovaSenha@123",
				},
			},
		},
		response: {
			200: {
				description: "Senha redefinida com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: { type: "null" },
				},
			},
			400: {
				description: "Código inválido ou expirado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			404: {
				description: "Email não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public getResidents = {
		querystring: {
			type: "object",
			properties: {
				page: {
					type: "string",
					pattern: "^[0-9]+$",
					description: "Número da página (padrão: 1)",
				},
				limit: {
					type: "string",
					pattern: "^[0-9]+$",
					description: "Itens por página (padrão: 10)",
				},
				search: {
					type: "string",
					description: "Termo de busca",
				},
				filterBy: {
					type: "string",
					enum: ["name", "phone", "email", "apartment"],
					description: "Campo para filtrar a busca",
				},
				status: {
					type: "string",
					enum: [
						"A_CONFIRMACAO_EMAIL",
						"A_VALIDACAO",
						"REJEITADO",
						"INATIVO",
						"ATIVO",
					],
					description: "Filtrar por status",
				},
			},
		},
		response: {
			200: {
				description: "Lista de residentes",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							data: {
								type: "array",
								items: {
									type: "object",
									properties: {
										_id: { type: "string" },
										name: { type: "string" },
										email: { type: "string" },
										phone: { type: "string" },
										apartmentId: { type: "string" },
										apartmentNumber: { type: "string" },
										status: { type: "string" },
									},
								},
							},
							total: { type: "number" },
							totalPages: { type: "number" },
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

	public countResidents = {
		response: {
			200: {
				description: "Contagem de residentes",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: { type: "number" },
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

	public getResidentById = {
		params: {
			type: "object",
			properties: {
				id: {
					type: "string",
					description: "ID do residente",
				},
			},
			required: ["id"],
		},
		response: {
			200: {
				description: "Residente encontrado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							name: { type: "string" },
							email: { type: "string" },
							phone: { type: "string" },
							buildingId: { type: "string" },
							apartmentId: { type: "string" },
							status: { type: "string" },
							photoUrl: { type: ["string", "null"] },
							residentCode: { type: "string" },
							createdAt: { type: "string", format: "date-time" },
							updatedAt: { type: "string", format: "date-time" },
							apartment: {
								type: ["object", "null"],
								properties: {
									_id: { type: "string" },
									number: { type: "string" },
									block: { type: "string" },
									floor: { type: "number" },
									status: { type: "string" },
								},
							},
						},
					},
				},
			},
			400: {
				description: "Erro de validação",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			404: {
				description: "Residente não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public approveResident = {
		params: {
			type: "object",
			required: ["id"],
			properties: {
				id: { type: "string", description: "ID do residente" },
			},
		},
		body: {
			type: "object",
			properties: {},
		},
		response: {
			200: {
				description: "Residente aprovado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							name: { type: "string" },
							email: { type: "string" },
							status: { type: "string" },
						},
					},
				},
			},
			400: {
				description: "Erro de validação ou status inválido",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			403: {
				description: "Acesso negado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			404: {
				description: "Residente não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public rejectResident = {
		params: {
			type: "object",
			required: ["id"],
			properties: {
				id: { type: "string", description: "ID do residente" },
			},
		},
		body: {
			type: "object",
			required: ["rejectType"],
			properties: {
				rejectType: {
					type: "string",
					enum: [
						"DADOS_INCONSISTENTES",
						"DOCUMENTO_INVALIDO",
						"INFORMACOES_INCOMPLETAS",
						"NAO_PERTENCE_AO_CONDOMINIO",
						"OUTRO",
					],
					description: "Tipo de rejeição",
				},
				rejectNote: {
					type: "string",
					description: "Anotação sobre a rejeição",
				},
			},
		},
		response: {
			200: {
				description: "Residente rejeitado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							name: { type: "string" },
							email: { type: "string" },
							status: { type: "string" },
							rejectType: { type: "string" },
							rejectNote: { type: "string", nullable: true },
						},
					},
				},
			},
			400: {
				description: "Erro de validação ou status inválido",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			403: {
				description: "Acesso negado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			404: {
				description: "Residente não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public deactivateResident = {
		params: {
			type: "object",
			required: ["id"],
			properties: {
				id: { type: "string", description: "ID do residente" },
			},
		},
		body: {
			type: "object",
			required: ["inactiveType"],
			properties: {
				inactiveType: {
					type: "string",
					enum: [
						"SOLICITACAO_DO_RESIDENTE",
						"VIOLACAO_DE_REGULAMENTO",
						"INADIMPLENCIA",
						"MUDANCA_DE_ENDERECO",
						"OUTRO",
					],
					description: "Tipo de inativação",
				},
				inactiveNote: {
					type: "string",
					nullable: true,
					description: "Anotação sobre a inativação (opcional)",
				},
			},
		},
		response: {
			200: {
				description: "Residente inativado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							name: { type: "string" },
							email: { type: "string" },
							status: { type: "string" },
						},
					},
				},
			},
			400: {
				description: "Erro de validação ou status inválido",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			403: {
				description: "Acesso negado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			404: {
				description: "Residente não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};

	public activateResident = {
		params: {
			type: "object",
			required: ["id"],
			properties: {
				id: { type: "string", description: "ID do residente" },
			},
		},
		body: {
			type: "object",
			properties: {},
		},
		response: {
			200: {
				description: "Residente ativado com sucesso",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
					data: {
						type: "object",
						properties: {
							_id: { type: "string" },
							name: { type: "string" },
							email: { type: "string" },
							status: { type: "string" },
						},
					},
				},
			},
			400: {
				description: "Erro de validação ou status inválido",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			403: {
				description: "Acesso negado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
			404: {
				description: "Residente não encontrado",
				type: "object",
				properties: {
					success: { type: "boolean" },
					message: { type: "string" },
				},
			},
		},
	};
}
