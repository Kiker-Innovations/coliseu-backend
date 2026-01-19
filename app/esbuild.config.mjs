import * as esbuild from "esbuild";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Lista de dependências que devem ser externalizadas (não incluídas no bundle).
 * O AWS SDK já está disponível no runtime do Lambda Node.js 18+
 */
const externalDependencies = ["@aws-sdk/*", "aws-sdk"];

/**
 * Dependências que precisam de arquivos nativos ou binários
 * e não podem ser bundled corretamente
 */
const nativeDependencies = ["bcrypt"];

/**
 * Plugin para resolver path aliases do TypeScript (@/*)
 * Isso garante que imports como `@/config/env` sejam resolvidos corretamente
 */
const aliasPlugin = {
	name: "alias-plugin",
	setup(build) {
		const srcDir = join(__dirname, "src");

		// Resolve imports que começam com @/
		build.onResolve({ filter: /^@\// }, (args) => {
			const relativePath = args.path.replace(/^@\//, "");
			const resolvedPath = join(srcDir, relativePath);

			// Tenta resolver com diferentes extensões
			const extensions = [".ts", ".tsx", ".js", ".jsx", ".json", ""];
			for (const ext of extensions) {
				const fullPath = resolvedPath + ext;
				if (existsSync(fullPath)) {
					return { path: fullPath };
				}
				// Verifica se é um diretório com index
				const indexPath = join(resolvedPath, `index${ext || ".ts"}`);
				if (existsSync(indexPath)) {
					return { path: indexPath };
				}
			}

			return { path: resolvedPath };
		});
	},
};

/**
 * Carrega informações do package.json para injetar no bundle
 */
function loadPackageInfo() {
	const packagePath = join(__dirname, "package.json");
	const pkg = JSON.parse(readFileSync(packagePath, "utf-8"));
	return {
		name: pkg.name,
		version: pkg.version,
	};
}

async function build() {
	const outdir = join(__dirname, "dist");
	const packageInfo = loadPackageInfo();

	// Limpa e cria diretório de saída
	if (!existsSync(outdir)) {
		mkdirSync(outdir, { recursive: true });
	}

	console.log("🚀 Building Lambda bundle with esbuild...\n");
	console.log(`📦 Package: ${packageInfo.name}@${packageInfo.version}\n`);

	try {
		const result = await esbuild.build({
			entryPoints: [join(__dirname, "src/lambda.ts")],
			bundle: true,
			platform: "node",
			target: "node20",
			format: "esm",
			outfile: join(outdir, "lambda.mjs"),
			outExtension: { ".js": ".mjs" },

			// Otimizações para performance
			minify: true,
			minifyWhitespace: true,
			minifyIdentifiers: true,
			minifySyntax: true,
			treeShaking: true,
			sourcemap: false,
			keepNames: true, // Preserva nomes de funções para stack traces
			legalComments: "none", // Remove comentários de licença para reduzir tamanho

			// Dependências externas
			external: [...externalDependencies, ...nativeDependencies],

			// Resolução de módulos
			mainFields: ["module", "main"],
			conditions: ["node", "import"],
			resolveExtensions: [".ts", ".tsx", ".js", ".jsx", ".json"],

			// Plugins
			plugins: [aliasPlugin],

			// Injeção de constantes em tempo de build
			// Isso permite que o código acesse informações do package.json sem ler o arquivo
			define: {
				"process.env.BUILD_PACKAGE_NAME": JSON.stringify(packageInfo.name),
				"process.env.BUILD_PACKAGE_VERSION": JSON.stringify(
					packageInfo.version,
				),
			},

			// Banner para compatibilidade ESM/CJS
			banner: {
				js: `
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
`.trim(),
			},

			// Metadados para análise do bundle
			metafile: true,
			logLevel: "info",

			// Configurações adicionais de otimização
			drop: ["debugger"], // Remove statements debugger
			pure: ["console.debug"], // Remove console.debug (mantém log, warn, error)
			charset: "utf8",
		});

		// Mostra estatísticas do bundle
		console.log("\n📊 Bundle Statistics:");
		const outputs = Object.entries(result.metafile.outputs);
		for (const [file, info] of outputs) {
			const sizeKB = (info.bytes / 1024).toFixed(2);
			const sizeMB = (info.bytes / (1024 * 1024)).toFixed(2);
			console.log(`   📦 ${file}`);
			console.log(`      Size: ${sizeKB} KB (${sizeMB} MB)`);

			// Mostra as maiores dependências incluídas
			if (info.inputs) {
				const inputs = Object.entries(info.inputs)
					.map(([path, data]) => ({ path, bytes: data.bytesInOutput }))
					.filter((i) => i.bytes > 10000) // Apenas arquivos > 10KB
					.sort((a, b) => b.bytes - a.bytes)
					.slice(0, 10);

				if (inputs.length > 0) {
					console.log("      Top 10 largest modules:");
					for (const input of inputs) {
						console.log(
							`         - ${input.path}: ${(input.bytes / 1024).toFixed(1)} KB`,
						);
					}
				}
			}
		}

		// Warnings sobre dependências externas não encontradas
		if (result.warnings.length > 0) {
			console.log("\n⚠️ Warnings:");
			for (const warning of result.warnings) {
				console.log(`   - ${warning.text}`);
			}
		}

		console.log("\n✅ Build completed successfully!");
	} catch (error) {
		console.error("❌ Build failed:", error);
		process.exit(1);
	}
}

build();
