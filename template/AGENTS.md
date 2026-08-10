# Agent Instructions

## Project

This is a Google Apps Script web app built with React, TypeScript, Vite, Tailwind CSS, shadcn/ui (Base UI), and clasp. Use **bun** for package management.

## Core Commands

```bash
bun install
bun run dev
bun run lint
bun run typecheck
bun run build
bun run push
```

Use `package.json` for the complete script list. Direct clasp commands run from the project root after `.clasp.json` has been configured.

## Key Locations

- Setup and structure: `README.md`
- Browser source: `src/web/`
- React entry point: `src/web/main.tsx`
- Root component: `src/web/App.tsx`
- shadcn/ui components: `src/web/components/ui/`
- GAS source: `src/gas/`
- Generated clasp target: `dist/`
- Project manifest: `src/gas/appsscript.json`
- clasp workflow: `.rules/clasp-guide.md`
- TypeScript conventions: `.rules/typescript.md`
- Readability and review: `.rules/readable-code.md`, `.rules/styleguide.md`

## Workflow and Safety

- Edit `src/web/` for browser code and `src/gas/` for Apps Script code; treat `dist/` as disposable build output.
- Keep `doGet`, `doPost`, and spreadsheet-callable GAS functions at top level without `export`.
- Keep public web apps at `src/gas/appsscript.json` with `webapp.access` set to `ANYONE`.
- Use GAS libraries or browser-side CDNs for the GAS runtime; React and npm packages are bundled into the frontend by Vite and do not run server-side.
- Copy `.clasp.json.example` to `.clasp.json`, set `rootDir` to `dist`, and keep the script ID untracked.
- `HtmlService.createHtmlOutputFromFile("index")` serves the built `dist/index.html`; edit `src/web/index.html`.
- Call GAS functions from React via the type-safe wrapper `src/web/lib/gas-run.ts` (`runFunction<T>(name, ...args)`).
- Add shadcn/ui components with `bunx shadcn@latest add <component>` (Base UI primitives).
- shadcn/ui conventions: follow the shadcn rules (use `cn()`, semantic tokens, `data-icon`, `gap-*` spacing, Base UI `render` prop, etc.).

## Communication

- Write code review comments in Japanese.
