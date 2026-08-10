#!/usr/bin/env bun

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

const projectName = process.argv[2] ?? "my-gas-project";
const targetDir = path.resolve(process.cwd(), projectName);

if (fs.existsSync(targetDir)) {
	console.error(`Error: Directory "${projectName}" already exists.`);
	process.exit(1);
}

console.log(`Creating a new Google Apps Script project in ${targetDir}...`);

// Bun resolves the template root from the current module directory.
// Source: https://bun.sh/docs/guides/util/import-meta-dir
const templateDir = path.resolve(import.meta.dir, "..", "template");
fs.cpSync(templateDir, targetDir, { recursive: true });
fs.renameSync(
	path.resolve(targetDir, "gitignore"),
	path.resolve(targetDir, ".gitignore"),
);

const newPackageJsonPath = path.resolve(targetDir, "package.json");
const newPackageJson: unknown = JSON.parse(
	fs.readFileSync(newPackageJsonPath, "utf8"),
);
if (!isRecord(newPackageJson)) {
	throw new Error("Template package.json must contain a JSON object.");
}
newPackageJson.name = projectName;
newPackageJson.version = "0.1.0";
fs.writeFileSync(newPackageJsonPath, JSON.stringify(newPackageJson, null, 2));

console.log("Installing dependencies...");
execFileSync("bun", ["install"], { cwd: targetDir, stdio: "inherit" });

console.log("\nSuccess! Your project is ready.");
console.log(`\n  cd ${projectName}`);
console.log("  bunx clasp login");
console.log(
	'  bunx clasp create --type standalone --rootDir ./dist --title "My GAS Web App"',
);
console.log("  bun run dev\n");
