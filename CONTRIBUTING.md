# Contributing

Thank you for considering contributing to `create-gas-starter`! This document
explains how to set up the project and what conventions to follow.

## Development Setup

```bash
bun install
bun run dev
```

Run the checks before submitting a change:

```bash
bun run lint
bun run typecheck
bun run build
bun run test:smoke
bun run sample:typecheck
bun run sample:build
bun run sample:spreadsheet-mcp:typecheck
bun run sample:spreadsheet-mcp:build
```

## Branching

- Create a feature branch off `main` (e.g. `feat/your-change`).
- Use the `directory-architecture` skill for directory changes and the
  `writing-for-agents` skill for documentation when available.

## Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add a new flag to the CLI
fix: resolve a template path bug
docs: clarify Bun requirement
```

Keep commits local; push only when asked. Each logical change is validated
before its commit.

## Pull Request Process

1. Make sure all checks pass locally.
2. Open a PR against `main` with a clear description of the change.
3. Reference the issue it fixes, if any.
4. Wait for review; address feedback before merge.