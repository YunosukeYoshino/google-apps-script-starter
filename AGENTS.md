---
last-validated: 2026-08-19
---

# Agent Instructions

## Project

- **What:** This repository publishes the `create-gas-starter` CLI.
- **Why:** Separate CLI and template boundaries prevent repository tooling from leaking into generated projects.
- **How:** CLI code lives in `src/`; files copied into generated GAS projects live in `template/`.

```text
src/          CLI package source
template/     Generated-project files
scripts/      Repository checks
```

Use **bun** for package management.

## Core Commands

```bash
bun install
bun run dev
bun run lint
bun run typecheck
bun run build
bun run test
bun run test:smoke
```

Run other repository scripts through `package.json`. Commands that call clasp directly must run against the template project:

```bash
bunx --cwd template clasp open-script
bunx --cwd template clasp logs --watch
```

## Key Locations

| Responsibility | Path |
|---|---|
| CLI implementation | `src/cli.ts` |
| Scaffolded project | `template/` |
| Generated-project instructions | `template/AGENTS.md` |
| Generated-project setup | `template/README.md` |
| GAS and TypeScript conventions | `template/.rules/` |

## Rules

- Directory changes: use the `directory-architecture` skill when it is available; otherwise preserve the existing layout.
- Documentation for agents: use the `writing-for-agents` skill when it is available.

## Workflow and Safety

- Edit `template/src/` for generated app code. Treat `template/dist/` as disposable build output.
- Keep `doGet`, `doPost`, and spreadsheet-callable GAS functions at top level without `export`.
- Keep public web apps at `template/src/gas/appsscript.json` with `webapp.access` set to `ANYONE`. Keep the optional MCP overlay at `template/.options/mcp/src/gas/appsscript.json` with `webapp.access` set to `ANYONE_ANONYMOUS`.
- Use GAS libraries or browser-side CDNs; npm packages do not execute in the GAS runtime.
- Before direct clasp commands, copy `template/.clasp.json.example` inside `template/`, use the standard clasp configuration filename, and keep its script ID untracked.
- Validate each logical change before a Conventional Commit. Keep commits local unless the user explicitly requests a push.

## Communication

- Write code review comments in Japanese.
