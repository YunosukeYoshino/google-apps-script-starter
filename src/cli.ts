#!/usr/bin/env bun

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

const cliArgs = process.argv.slice(2);
if (cliArgs.includes("--help")) {
	console.log(`Usage: create-gas-starter [project-name] [--mcp]

Options:
  --mcp   Include a Gemini Spark-compatible MCP Tools adapter.
  --help  Show this help message.`);
	process.exit(0);
}
const unknownOption = cliArgs.find(
	(arg) => arg.startsWith("-") && arg !== "--mcp",
);
if (unknownOption) {
	console.error(`Error: Unknown option "${unknownOption}".`);
	process.exit(1);
}
const includeMcp = cliArgs.includes("--mcp");
const positionalArgs = cliArgs.filter((arg) => arg !== "--mcp");
if (positionalArgs.length > 1) {
	console.error("Error: Specify only one project name.");
	process.exit(1);
}
const projectName = positionalArgs[0] ?? "my-gas-project";
const targetDir = path.resolve(process.cwd(), projectName);

if (fs.existsSync(targetDir)) {
	console.error(`Error: Directory "${projectName}" already exists.`);
	process.exit(1);
}

console.log(`Creating a new Google Apps Script project in ${targetDir}...`);

// Bun resolves the template root from the current module directory.
// Source: https://bun.sh/docs/guides/util/import-meta-dir
const templateDir = path.resolve(import.meta.dir, "..", "template");
const templateOptionsDir = path.resolve(templateDir, ".options");
fs.cpSync(templateDir, targetDir, {
	recursive: true,
	filter(source) {
		return (
			source !== templateOptionsDir &&
			!source.startsWith(`${templateOptionsDir}${path.sep}`)
		);
	},
});
if (includeMcp) {
	fs.cpSync(path.resolve(templateOptionsDir, "mcp"), targetDir, {
		recursive: true,
	});
	const mcpSourcePath = path.resolve(targetDir, "src", "gas", "mcp.gs");
	const mcpSource = fs.readFileSync(mcpSourcePath, "utf8");
	fs.writeFileSync(
		mcpSourcePath,
		mcpSource.replace(
			'var MCP_SERVER_NAME_ = "my-gas-project";',
			`var MCP_SERVER_NAME_ = ${JSON.stringify(projectName)};`,
		),
	);
}
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
	'  bunx clasp create --type webapp --rootDir ./dist --title "My GAS Web App"',
);
console.log("  bun run dev\n");
