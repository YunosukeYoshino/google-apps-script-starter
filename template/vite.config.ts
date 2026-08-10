import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
	root: "src/web",
	plugins: [
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
					src: "../gas/main.gs",
					dest: ".",
					rename: { stripBase: true },
				},
			],
		}),
	],
	build: {
		outDir: "../../dist",
		emptyOutDir: true,
	},
});
