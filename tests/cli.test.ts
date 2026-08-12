import { afterEach, describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dir, "..");
const cliPath = path.join(repoRoot, "src", "cli.ts");
const workDirs: string[] = [];

afterEach(() => {
	for (const workDir of workDirs.splice(0)) {
		fs.rmSync(workDir, { recursive: true, force: true });
	}
});

function runCli(...args: string[]): string {
	const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "gas-starter-cli-"));
	const fakeBinDir = path.join(workDir, "bin");
	fs.mkdirSync(fakeBinDir);
	fs.writeFileSync(path.join(fakeBinDir, "bun"), "#!/bin/sh\nexit 0\n");
	fs.chmodSync(path.join(fakeBinDir, "bun"), 0o755);
	workDirs.push(workDir);

	return execFileSync(process.execPath, [cliPath, ...args], {
		cwd: workDir,
		encoding: "utf8",
		env: {
			...process.env,
			PATH: `${fakeBinDir}${path.delimiter}${process.env.PATH ?? ""}`,
		},
	});
}

describe("create-gas-starter CLI", () => {
	test("user can discover the MCP option from CLI help", () => {
		const output = runCli("--help");

		expect(output).toContain(
			"Usage: create-gas-starter [project-name] [--mcp]",
		);
		expect(output).toContain("--mcp");
	});

	test("user is warned about an unknown option", () => {
		expect(() => runCli("spark-tools", "--unknown")).toThrow();
	});

	test("user is warned about an extra project name", () => {
		expect(() => runCli("spark-tools", "ignored-name", "--mcp")).toThrow();
	});

	test("user can scaffold a Gemini Spark MCP adapter with --mcp", () => {
		runCli("spark-tools", "--mcp");

		const projectDir = path.join(workDirs[0], "spark-tools");
		expect(fs.existsSync(path.join(projectDir, "src/gas/mcp.gs"))).toBe(true);
		expect(
			JSON.parse(
				fs.readFileSync(
					path.join(projectDir, "src/gas/appsscript.json"),
					"utf8",
				),
			).webapp.access,
		).toBe("ANYONE_ANONYMOUS");
		expect(
			fs.readFileSync(path.join(projectDir, "src/gas/mcp.gs"), "utf8"),
		).toContain('var MCP_SERVER_NAME_ = "spark-tools";');
		expect(fs.existsSync(path.join(projectDir, "MCP.md"))).toBe(true);
		expect(
			fs.readFileSync(path.join(projectDir, "README.md"), "utf8"),
		).toContain("[MCP.md](MCP.md)");
		expect(
			fs.readFileSync(path.join(projectDir, "AGENTS.md"), "utf8"),
		).toContain("MCP Tools adapter: `MCP.md`");
	});

	test("existing scaffold remains unchanged without --mcp", () => {
		runCli("web-only");

		const projectDir = path.join(workDirs[0], "web-only");
		expect(fs.existsSync(path.join(projectDir, "src/gas/mcp.gs"))).toBe(false);
		expect(
			JSON.parse(
				fs.readFileSync(
					path.join(projectDir, "src/gas/appsscript.json"),
					"utf8",
				),
			).webapp.access,
		).toBe("ANYONE");
	});
});
