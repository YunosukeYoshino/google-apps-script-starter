import path from "node:path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
	root: "src/web",
	plugins: [
		react(),
		tailwindcss(),
		viteSingleFile(),
		viteStaticCopy({
			targets: [
				{
					src: "../gas/appsscript.json",
					dest: ".",
					rename: { stripBase: true },
				},
				{
					src: "../gas/*.gs",
					dest: ".",
					rename: { stripBase: true },
				},
			],
		}),
	],
	resolve: {
		alias: {
			"@": path.resolve(import.meta.dirname, "src/web"),
		},
	},
	build: {
		outDir: "../../dist",
		emptyOutDir: true,
	},
});
