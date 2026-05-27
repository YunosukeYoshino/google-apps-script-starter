# Agent Instructions

## Package Manager

- Use **bun**: `bun install`

## Commands

| Task | Command |
|------|---------|
| Dev server | `bun run dev` |
| Build | `bun run build` |
| Push to GAS | `bun run push` |
| Deploy | `bun run deploy` |
| List deployments | `bun run deployments` |
| Open web app | `bun run open` |
| Lint | `bun run lint` |
| Lint fix | `bun run lint:fix` |
| Format | `bun run format` |
| Lint file | `bun run lint -- path/to/file.ts` |
| Open GAS editor | `bunx clasp open` |
| Watch logs | `bunx clasp logs --watch` |

## External References

| Need | File |
|------|------|
| Setup & structure | `README.md` |
| Project overview | `.rules/overview.md` |
| clasp workflow | `.rules/clasp-guide.md` |
| TypeScript | `.rules/typescript.md` |
| Readable code | `.rules/readable-code.md` |
| Code review | `.rules/styleguide.md` |

## Key Conventions

- Edit `src/` only; `dist/` is build output and the clasp push target.
- `doGet`, `doPost`, and spreadsheet-callable functions: top-level functions, no `export`.
- Public web apps: set `src/appsscript.json` `webapp.access` to `ANYONE`.
- npm packages do not run in the GAS runtime; use GAS libraries or CDN on the web side.
- `HtmlService.createTemplateFromFile("index")` serves `dist/index.html` after push (edit `src/index.html`).
- Copy `.clasp.json.example` to `.clasp.json` and set `rootDir` to `dist`.

## Communication

- Code review comments: Japanese.
