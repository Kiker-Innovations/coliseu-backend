import * as esbuild from "esbuild";
import { existsSync, mkdirSync } from "node:fs";
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

async function build() {
	const outdir = join(__dirname, "dist");

	// Limpa e cria diretório de saída
	if (!existsSync(outdir)) {
		mkdirSync(outdir, { recursive: true });
	}

	console.log("🚀 Building Lambda bundle with esbuild...\n");

	try {
		const result = await esbuild.build({
			entryPoints: [join(__dirname, "src/lambda.ts")],
			bundle: true,
			platform: "node",
			target: "node20",
			format: "esm",
			outfile: join(outdir, "lambda.mjs"),
			outExtension: { ".js": ".mjs" },
			minify: true,
			treeShaking: true,
			sourcemap: false,
			keepNames: true, // Preserva nomes de funções para stack traces
			external: [...externalDependencies, ...nativeDependencies],
			mainFields: ["module", "main"],
			conditions: ["node", "import"],
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
			metafile: true, // Gera metadados para análise
			logLevel: "info",
			legalComments: "none", // Remove comentários de licença para reduzir tamanho
		});

		// Mostra estatísticas do bundle
		const outputs = Object.entries(result.metafile.outputs);
		for (const [file, info] of outputs) {
			const sizeKB = (info.bytes / 1024).toFixed(2);
			const sizeMB = (info.bytes / (1024 * 1024)).toFixed(2);
			console.log(`\n📦 Bundle: ${file}`);
			console.log(`   Size: ${sizeKB} KB (${sizeMB} MB)`);
		}

		console.log("\n✅ Build completed successfully!");
	} catch (error) {
		console.error("❌ Build failed:", error);
		process.exit(1);
	}
}

build();
