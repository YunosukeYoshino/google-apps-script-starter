# Google Apps Script Starter

The npm source for `create-gas-starter`, a CLI that scaffolds Google Apps Script web apps using TypeScript, Vite, Tailwind CSS, and clasp.

## Usage

```bash
npx create-gas-starter my-gas-project
```

The generated project documentation lives in [`template/README.md`](template/README.md).

## Repository structure

```text
src/          CLI package source
template/     Files copied into generated projects
sample/       Runnable GAS Web app example
scripts/      Repository support and smoke tests
```

## Development

```bash
bun install
bun run lint
bun run typecheck
bun run build
bun run test:smoke
bun run sample:typecheck
bun run sample:build
```

The runnable browser-to-GAS example is documented in [`sample/README.md`](sample/README.md).
