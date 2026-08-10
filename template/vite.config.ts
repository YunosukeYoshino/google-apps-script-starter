import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
	root: "src",
	plugins: [
		tailwindcss(),
		viteSingleFile(),
		viteStaticCopy({
			targets: [
				{
					src: ["appsscript.json", "main.gs"],
					dest: ".",
				},
			],
		}),
	],
	build: {
		outDir: "../dist",
		emptyOutDir: true,
	},
});
