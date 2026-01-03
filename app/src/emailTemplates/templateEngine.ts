import { getDate } from "@/v1/utils/utils";
import Handlebars from "handlebars";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const templateCache = new Map<string, HandlebarsTemplateDelegate>();

/**
 * Resolve o caminho correto para os templates de email.
 * No ambiente de desenvolvimento, os templates estão em src/emailTemplates.
 * No ambiente Lambda (bundle esbuild), estão em emailTemplates na raiz.
 */
function getTemplatesDir(): string {
  // Verifica se estamos no contexto do bundle (Lambda)
  // O bundle fica em /var/task/lambda.mjs
  const isLambda = process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;

  if (isLambda) {
    // No Lambda, os templates estão na raiz do diretório de trabalho
    return join(process.cwd(), "emailTemplates");
  }

  // Em desenvolvimento, usa o __dirname normal
  return __dirname;
}

export class TemplateEngine {
  private static compileTemplate(
    templateName: string
  ): HandlebarsTemplateDelegate {
    if (templateCache.has(templateName)) {
      return templateCache.get(templateName)!;
    }

    const templatePath = join(getTemplatesDir(), `${templateName}.hbs`);
    const templateSource = readFileSync(templatePath, "utf-8");

    const compiledTemplate = Handlebars.compile(templateSource);

    templateCache.set(templateName, compiledTemplate);

    return compiledTemplate;
  }

  public static render<T extends Record<string, any>>(
    templateName: string,
    data: T
  ): string {
    const template = this.compileTemplate(templateName);

    const contextData = {
      ...data,
      year: getDate().getFullYear(),
    };

    return template(contextData);
  }

  public static clearCache(): void {
    templateCache.clear();
  }

  public static registerHelper(
    name: string,
    helper: Handlebars.HelperDelegate
  ): void {
    Handlebars.registerHelper(name, helper);
  }

  public static registerHelpers(
    helpers: Record<string, Handlebars.HelperDelegate>
  ): void {
    for (const [name, helper] of Object.entries(helpers)) {
      Handlebars.registerHelper(name, helper);
    }
  }
}

TemplateEngine.registerHelpers({
  formatDate: (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  },

  uppercase: (str: string) => str.toUpperCase(),

  lowercase: (str: string) => str.toLowerCase(),

  ifEquals: function (arg1: any, arg2: any, options: any) {
    return arg1 === arg2 ? options.fn(this) : options.inverse(this);
  },

  currency: (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  },
});
