#!/usr/bin/env bun

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

type PackageJson = {
	name?: string;
	version?: string;
	bin?: unknown;
	files?: unknown;
	[key: string]: unknown;
};

const projectName = process.argv[2] ?? "my-gas-project";
const targetDir = path.resolve(process.cwd(), projectName);

if (fs.existsSync(targetDir)) {
	console.error(`Error: Directory "${projectName}" already exists.`);
	process.exit(1);
}

console.log(`Creating a new Google Apps Script project in ${targetDir}...`);

// Bun resolves the template root from the current module directory.
// Source: https://bun.sh/docs/guides/util/import-meta-dir
const templateDir = path.resolve(import.meta.dir, "..");

const filesToCopy = [
	"src",
	".rules",
	"AGENTS.md",
	".clasp.json.example",
	".claspignore",
	"biome.json",
	"package.json",
	"README.md",
	"tsconfig.json",
	"vite.config.ts",
	".gitignore",
] as const;

for (const file of filesToCopy) {
	const src = path.resolve(templateDir, file);
	const dest = path.resolve(targetDir, file);

	if (!fs.existsSync(src)) {
		continue;
	}

	if (fs.lstatSync(src).isDirectory()) {
		fs.cpSync(src, dest, { recursive: true });
		continue;
	}

	fs.copyFileSync(src, dest);
}

const newPackageJsonPath = path.resolve(targetDir, "package.json");
const newPackageJson = JSON.parse(
	fs.readFileSync(newPackageJsonPath, "utf8"),
) as PackageJson;
newPackageJson.name = projectName;
newPackageJson.version = "0.1.0";
delete newPackageJson.bin;
delete newPackageJson.files;
fs.writeFileSync(newPackageJsonPath, JSON.stringify(newPackageJson, null, 2));

console.log("Installing dependencies...");
try {
	execFileSync("bun", ["install"], { cwd: targetDir, stdio: "inherit" });
} catch {
	console.log("bun not found, falling back to npm...");
	execFileSync("npm", ["install"], { cwd: targetDir, stdio: "inherit" });
}

console.log("\nSuccess! Your project is ready.");
console.log(`\n  cd ${projectName}`);
console.log("  bunx clasp login");
console.log(
	'  bunx clasp create --type webapp --rootDir ./dist --title "My GAS Web App"',
);
console.log("  bun run dev\n");
