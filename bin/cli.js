#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const projectName = process.argv[2] || "my-gas-project";
const targetDir = path.resolve(process.cwd(), projectName);

if (fs.existsSync(targetDir)) {
	console.error(`Error: Directory "${projectName}" already exists.`);
	process.exit(1);
}

console.log(`Creating a new Google Apps Script project in ${targetDir}...`);

// Create project directory
fs.mkdirSync(targetDir, { recursive: true });

// Clone the template repository or copy local files if running from npm
// For simplicity in this template, we assume the files are included in the npm package
const templateDir = path.resolve(__dirname, "..");

const filesToCopy = [
	"src",
	".claspignore",
	"biome.json",
	"package.json",
	"README.md",
	"tsconfig.json",
	"vite.config.ts",
	".gitignore",
];

filesToCopy.forEach((file) => {
	const src = path.resolve(templateDir, file);
	const dest = path.resolve(targetDir, file);

	if (fs.existsSync(src)) {
		if (fs.lstatSync(src).isDirectory()) {
			fs.cpSync(src, dest, { recursive: true });
		} else {
			fs.copyFileSync(src, dest);
		}
	}
});

// Update package.json name
const newPackageJsonPath = path.resolve(targetDir, "package.json");
const newPackageJson = JSON.parse(fs.readFileSync(newPackageJsonPath, "utf8"));
newPackageJson.name = projectName;
newPackageJson.version = "0.1.0";
delete newPackageJson.bin; // Remove bin field in the new project
delete newPackageJson.files; // Remove files field
fs.writeFileSync(newPackageJsonPath, JSON.stringify(newPackageJson, null, 2));

console.log("Installing dependencies...");
try {
	execSync("bun install", { cwd: targetDir, stdio: "inherit" });
} catch (e) {
	console.log("bun not found, falling back to npm...");
	execSync("npm install", { cwd: targetDir, stdio: "inherit" });
}

console.log("\nSuccess! Your project is ready.");
console.log(`\n  cd ${projectName}`);
console.log("  clasp login");
console.log("  clasp create --type webapp");
console.log("  bun run dev\n");
