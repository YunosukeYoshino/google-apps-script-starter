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
const cliPath = path.join(repoRoot, "bin", "cli.ts");

try {
	execFileSync("bun", [cliPath, projectName], {
		cwd: workDir,
		stdio: "inherit",
	});

	execFileSync("bun", ["run", "build"], {
		cwd: projectDir,
		stdio: "inherit",
	});

	console.log("Smoke test passed.");
} finally {
	fs.rmSync(workDir, { recursive: true, force: true });
}
