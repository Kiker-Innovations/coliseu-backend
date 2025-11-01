import Handlebars from "handlebars";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cache de templates compilados
const templateCache = new Map<string, HandlebarsTemplateDelegate>();

export class TemplateEngine {
	/**
	 * Compila um template Handlebars
	 */
	private static compileTemplate(templateName: string): HandlebarsTemplateDelegate {
		// Verificar se já está no cache
		if (templateCache.has(templateName)) {
			return templateCache.get(templateName)!;
		}

		// Ler arquivo do template
		const templatePath = join(__dirname, `${templateName}.hbs`);
		const templateSource = readFileSync(templatePath, "utf-8");

		// Compilar template
		const compiledTemplate = Handlebars.compile(templateSource);

		// Adicionar ao cache
		templateCache.set(templateName, compiledTemplate);

		return compiledTemplate;
	}

	/**
	 * Renderiza um template com os dados fornecidos
	 */
	public static render<T extends Record<string, any>>(
		templateName: string,
		data: T,
	): string {
		const template = this.compileTemplate(templateName);

		// Adicionar helpers comuns
		const contextData = {
			...data,
			year: new Date().getFullYear(),
		};

		return template(contextData);
	}

	/**
	 * Limpa o cache de templates (útil em desenvolvimento)
	 */
	public static clearCache(): void {
		templateCache.clear();
	}

	/**
	 * Registra um helper customizado do Handlebars
	 */
	public static registerHelper(
		name: string,
		helper: Handlebars.HelperDelegate,
	): void {
		Handlebars.registerHelper(name, helper);
	}

	/**
	 * Registra múltiplos helpers de uma vez
	 */
	public static registerHelpers(
		helpers: Record<string, Handlebars.HelperDelegate>,
	): void {
		for (const [name, helper] of Object.entries(helpers)) {
			Handlebars.registerHelper(name, helper);
		}
	}
}

// Registrar helpers úteis
TemplateEngine.registerHelpers({
	// Formatador de data
	formatDate: (date: Date | string) => {
		const d = typeof date === "string" ? new Date(date) : date;
		return d.toLocaleDateString("pt-BR", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
	},

	// Uppercase
	uppercase: (str: string) => str.toUpperCase(),

	// Lowercase
	lowercase: (str: string) => str.toLowerCase(),

	// Condicional de igualdade
	ifEquals: function (arg1: any, arg2: any, options: any) {
		return arg1 === arg2 ? options.fn(this) : options.inverse(this);
	},

	// Formatador de moeda BRL
	currency: (value: number) => {
		return new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
		}).format(value);
	},
});

