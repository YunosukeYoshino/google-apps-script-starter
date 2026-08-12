import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
);
const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "gas-starter-smoke-"));
const projectName = "smoke-test-project";
const projectDir = path.join(workDir, projectName);
const mcpProjectName = "smoke-test-mcp-project";
const mcpProjectDir = path.join(workDir, mcpProjectName);
const cliPath = path.join(repoRoot, "src", "cli.ts");

try {
	execFileSync("bun", [cliPath, projectName], {
		cwd: workDir,
		stdio: "inherit",
	});

	execFileSync("bun", ["run", "build"], {
		cwd: projectDir,
		stdio: "inherit",
	});

	for (const requiredPath of [
		"src/gas/appsscript.json",
		"src/web/index.html",
		".rules/overview.md",
		".gitignore",
		"AGENTS.md",
		"vite.config.ts",
	]) {
		if (!fs.existsSync(path.join(projectDir, requiredPath))) {
			throw new Error(`Scaffold is missing ${requiredPath}`);
		}
	}

	const distHtml = fs.readFileSync(
		path.join(projectDir, "dist", "index.html"),
		"utf8",
	);
	if (!distHtml.includes('id="root"')) {
		throw new Error("dist/index.html is missing the React root mount point");
	}

	const distGs = fs.readFileSync(
		path.join(projectDir, "dist", "main.gs"),
		"utf8",
	);
	if (
		!distGs.includes("createHtmlOutputFromFile") ||
		!distGs.includes("getServerTime")
	) {
		throw new Error(
			"dist/main.gs is missing the HtmlOutput serving or getServerTime function",
		);
	}

	execFileSync("bun", [cliPath, mcpProjectName, "--mcp"], {
		cwd: workDir,
		stdio: "inherit",
	});
	execFileSync("bun", ["run", "build"], {
		cwd: mcpProjectDir,
		stdio: "inherit",
	});
	for (const requiredPath of [
		"src/gas/mcp.gs",
		"dist/mcp.gs",
		"dist/main.gs",
		"dist/appsscript.json",
	]) {
		if (!fs.existsSync(path.join(mcpProjectDir, requiredPath))) {
			throw new Error(`MCP scaffold is missing ${requiredPath}`);
		}
	}

	console.log("Smoke test passed.");
} finally {
	fs.rmSync(workDir, { recursive: true, force: true });
}
