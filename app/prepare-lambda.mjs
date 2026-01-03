import {
	existsSync,
	mkdirSync,
	cpSync,
	rmSync,
	writeFileSync,
	readFileSync,
	readdirSync,
	statSync,
} from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Dependências nativas que precisam ser copiadas para o bundle
 */
const nativeDependencies = ["bcrypt"];

/**
 * Pastas do node_modules que podemos ignorar para reduzir tamanho
 */
const foldersToRemove = [
	".bin",
	".cache",
	"test",
	"tests",
	"__tests__",
	"docs",
	"doc",
	"example",
	"examples",
	".github",
	".vscode",
	"coverage",
	"benchmark",
	"benchmarks",
	"src", // Remove arquivos fonte C/C++
	"tools",
];

/**
 * Plataformas de prebuilds do bcrypt que devemos manter.
 * Lambda ARM64 usa linux-arm64 com glibc
 */
const prebuildsToKeep = ["linux-arm64"];

/**
 * Extensões de arquivos que podemos remover
 */
const extensionsToRemove = [
	".md",
	".markdown",
	".ts", // Arquivos TypeScript fonte (mantemos apenas .js e .mjs)
	".map",
	".d.ts.map",
	".yml",
	".yaml",
	".lock",
	".editorconfig",
	".eslintrc",
	".eslintignore",
	".prettierrc",
	".npmignore",
	".gitignore",
	".travis.yml",
	"Makefile",
	"Gruntfile.js",
	"Gulpfile.js",
	".DS_Store",
];

/**
 * Arquivos específicos para remover
 */
const filesToRemove = [
	"LICENSE",
	"LICENSE.md",
	"LICENSE.txt",
	"CHANGELOG.md",
	"CHANGELOG",
	"HISTORY.md",
	"CONTRIBUTING.md",
	"README.md",
	"readme.md",
	"AUTHORS",
	"CONTRIBUTORS",
	"tsconfig.json",
	"tsconfig.build.json",
	"jest.config.js",
	".npmrc",
];

/**
 * Calcula o tamanho de um diretório recursivamente
 */
function getDirectorySize(dirPath) {
	let size = 0;
	if (!existsSync(dirPath)) return size;

	const files = readdirSync(dirPath);
	for (const file of files) {
		const filePath = join(dirPath, file);
		const stats = statSync(filePath);
		if (stats.isDirectory()) {
			size += getDirectorySize(filePath);
		} else {
			size += stats.size;
		}
	}
	return size;
}

/**
 * Remove arquivos e pastas desnecessários recursivamente
 */
function cleanDirectory(dirPath, parentDir = "") {
	if (!existsSync(dirPath)) return;

	const items = readdirSync(dirPath);

	for (const item of items) {
		const itemPath = join(dirPath, item);
		const stats = statSync(itemPath);

		if (stats.isDirectory()) {
			// Remove pastas desnecessárias
			if (foldersToRemove.includes(item)) {
				rmSync(itemPath, { recursive: true, force: true });
				continue;
			}

			// Limpa prebuilds não necessários (mantém apenas linux-arm64 para Lambda)
			if (parentDir === "prebuilds" && !prebuildsToKeep.includes(item)) {
				rmSync(itemPath, { recursive: true, force: true });
				continue;
			}

			// Limpa recursivamente
			cleanDirectory(itemPath, item);
		} else {
			// Remove arquivos por nome
			if (filesToRemove.includes(item)) {
				rmSync(itemPath, { force: true });
				continue;
			}
			// Remove arquivos por extensão
			const shouldRemove = extensionsToRemove.some(
				(ext) => item.endsWith(ext) || item === ext,
			);
			if (shouldRemove) {
				rmSync(itemPath, { force: true });
			}
		}
	}
}

async function prepare() {
	const distDir = join(__dirname, "dist");
	const nodeModulesDir = join(__dirname, "node_modules");
	const distNodeModulesDir = join(distDir, "node_modules");

	console.log("🔧 Preparing Lambda package...\n");

	// Cria diretório node_modules no dist
	if (!existsSync(distNodeModulesDir)) {
		mkdirSync(distNodeModulesDir, { recursive: true });
	}

	// Copia dependências nativas
	console.log("📋 Copying native dependencies...");
	for (const dep of nativeDependencies) {
		const srcPath = join(nodeModulesDir, dep);
		const destPath = join(distNodeModulesDir, dep);

		if (existsSync(srcPath)) {
			console.log(`   - ${dep}`);
			cpSync(srcPath, destPath, { recursive: true });

			// Copia dependências do bcrypt também
			const bcryptPackage = JSON.parse(
				readFileSync(join(srcPath, "package.json"), "utf-8"),
			);
			if (bcryptPackage.dependencies) {
				for (const subDep of Object.keys(bcryptPackage.dependencies)) {
					const subSrcPath = join(nodeModulesDir, subDep);
					const subDestPath = join(distNodeModulesDir, subDep);
					if (existsSync(subSrcPath) && !existsSync(subDestPath)) {
						console.log(`   - ${subDep} (dependency of ${dep})`);
						cpSync(subSrcPath, subDestPath, { recursive: true });
					}
				}
			}
		} else {
			console.warn(`   ⚠️ ${dep} not found in node_modules`);
		}
	}

	// Copia templates de email para a mesma estrutura relativa que o código espera
	// O templateEngine.ts usa __dirname para encontrar os templates
	// Como o bundle final será lambda.mjs na raiz do dist, os templates devem estar acessíveis
	const emailTemplatesDir = join(__dirname, "src/emailTemplates");
	const distEmailTemplatesDir = join(distDir, "emailTemplates");
	if (existsSync(emailTemplatesDir)) {
		console.log("\n📧 Copying email templates...");
		if (existsSync(distEmailTemplatesDir)) {
			rmSync(distEmailTemplatesDir, { recursive: true, force: true });
		}
		mkdirSync(distEmailTemplatesDir, { recursive: true });

		// Copia apenas arquivos .hbs
		const templates = readdirSync(emailTemplatesDir).filter((f) =>
			f.endsWith(".hbs"),
		);
		for (const template of templates) {
			cpSync(
				join(emailTemplatesDir, template),
				join(distEmailTemplatesDir, template),
			);
			console.log(`   - ${template}`);
		}
	}

	// Cria um package.json mínimo no dist para o Lambda
	const minimalPackage = {
		name: "coliseu-lambda",
		version: "1.0.0",
		type: "module",
	};
	writeFileSync(
		join(distDir, "package.json"),
		JSON.stringify(minimalPackage, null, 2),
	);

	// Limpa node_modules copiado
	console.log("\n🧹 Cleaning unnecessary files from node_modules...");
	const sizeBefore = getDirectorySize(distNodeModulesDir);
	cleanDirectory(distNodeModulesDir);
	const sizeAfter = getDirectorySize(distNodeModulesDir);
	const saved = ((sizeBefore - sizeAfter) / 1024 / 1024).toFixed(2);
	console.log(`   Saved: ${saved} MB`);

	// Calcula tamanho final
	const finalSize = getDirectorySize(distDir);
	console.log(
		`\n📊 Final package size: ${(finalSize / 1024 / 1024).toFixed(2)} MB`,
	);

	console.log("\n✅ Lambda package prepared successfully!");
}

prepare().catch(console.error);
