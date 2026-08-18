# Google Apps Script Starter

The npm source for `create-gas-starter`, a CLI that scaffolds Google Apps Script web apps using React, TypeScript, Vite, Tailwind CSS, shadcn/ui (Base UI), and clasp.

## Usage

> **Prerequisite:** [Bun](https://bun.sh) must be installed. The CLI runs on Bun and requires it at scaffold time.

```bash
npx @yunosukeyoshino/google-apps-script-starter my-gas-project
```

To include a Gemini Spark-compatible MCP Tools adapter:

```bash
npx @yunosukeyoshino/google-apps-script-starter my-gas-project --mcp
```

The adapter exposes explicitly registered Apps Script functions through
`tools/list` and `tools/call`. The generated `MCP.md` covers deployment, token
setup, Spark connection, security, and GAS compatibility limits.

The generated project documentation lives in [`template/README.md`](template/README.md).

## Repository structure

```text
src/          CLI package source
template/     Files copied into generated projects
sample/       Runnable GAS Web app example
sample-mcp/   Runnable Gemini Spark MCP + Spreadsheet example
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
bun run sample-mcp:typecheck
bun run sample-mcp:build
```

The runnable browser-to-GAS example is documented in [`sample/README.md`](sample/README.md).
The Spreadsheet MCP example is documented in [`sample-mcp/README.md`](sample-mcp/README.md).

## Contributing

Contributions are welcome! See [`CONTRIBUTING.md`](CONTRIBUTING.md) for setup
and conventions. Please also read the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE) © [YunosukeYoshino](https://github.com/YunosukeYoshino)
