# Google Apps Script Starter

A starter template for Google Apps Script development with React, TypeScript, Vite, Tailwind CSS, and shadcn/ui.

## Features

[![React](https://img.shields.io/badge/React-v19.2-61DAFB?logo=react)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-v8.0-646CFF?logo=vite)](https://vitejs.dev/)
[![shadcn/ui](https://img.shields.io/badge/shadcn_ui-Base_UI-000000?logo=shadcnui)](https://ui.shadcn.com/)
[![Oxlint](https://img.shields.io/badge/Oxlint-v1.77-0A7EA4?logo=oxc)](https://oxc.rs/)
[![Oxfmt](https://img.shields.io/badge/Oxfmt-v0.62-0A7EA4?logo=oxc)](https://oxc.rs/)
[![clasp](https://img.shields.io/badge/clasp-v3.0-4285F4?logo=google-apps-script)](https://github.com/google/clasp)

A professional boilerplate for developing Google Apps Script (GAS) web applications using modern web development standards. This starter leverages Vite for rapid development, React for a component-based UI, and Tailwind CSS v4 with shadcn/ui (Base UI primitives) for a polished, accessible interface — all while maintaining a single-file deployment optimized for the GAS environment.

## 🛠 Tech Stack

The project integrates high-performance tools to ensure a robust developer experience and clean code quality.

| Category       | Technology                                           | Description                                                                      |
| :------------- | :--------------------------------------------------- | :------------------------------------------------------------------------------- |
| **Runtime**    | Google Apps Script                                   | V8 Engine environment.                                                           |
| **UI**         | [React 19](https://react.dev/)                       | Component-based user interface.                                                  |
| **Bundler**    | [Vite 8](https://vitejs.dev/)                        | Next-generation frontend tooling for HMR and optimized builds.                   |
| **Styling**    | [Tailwind CSS v4](https://tailwindcss.com/)          | High-performance, CSS-first design framework.                                    |
| **Components** | [shadcn/ui](https://ui.shadcn.com/)                  | Copy-paste components built on [Base UI](https://base-ui.com/) (MUI) primitives. |
| **Language**   | [TypeScript](https://www.typescriptlang.org/)        | Type-safe browser-side development.                                              |
| **Tooling**    | [Oxlint](https://oxc.rs/) + [Oxfmt](https://oxc.rs/) | Oxc による高速 lint とフォーマット。                                             |
| **Deployment** | [clasp](https://github.com/google/clasp)             | Command-line utility to manage Apps Script projects.                             |
| **Manager**    | [Bun](https://bun.sh/)                               | Fast JavaScript all-in-one toolkit.                                              |

## ✨ Key Features

- **Optimized Assets**: Automatically inlines JS and CSS into a single HTML file using `vite-plugin-singlefile`, ensuring seamless integration with GAS `HtmlService`.
- **React UI**: Component-based UI with React 19 and shadcn/ui components.
- **Modern Workflow**: Local development server with Hot Module Replacement (HMR) for the UI.
- **Strict Quality Control**: Pre-configured Oxlint linting and Oxfmt formatting.
- **Explicit Runtime Boundaries**: Browser code lives in `src/web/`, while Apps Script code and configuration live in `src/gas/`.

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed on your machine.
- Access to [script.google.com](https://script.google.com/).

### Installation

1. Install dependencies in the generated project directory:

   ```bash
   bun install
   ```

2. Authenticate with clasp (if not already):

   ```bash
   bunx clasp login
   ```

3. Create a GAS web app project with `rootDir` set to `dist`:

   ```bash
   bunx clasp create --type webapp --rootDir ./dist --title "My GAS Web App"
   ```

   This writes `.clasp.json` with `"rootDir": "dist"`. clasp 3 does not transpile TypeScript; Vite builds into `dist/` before push.
   Source: https://github.com/google/clasp/blob/master/README.md#drop-typescript-support

   To configure manually instead, copy the example file and set your `scriptId`:

   ```bash
   cp .clasp.json.example .clasp.json
   ```

### Development

Start the Vite development server to work on the UI:

```bash
bun run dev
```

### Deployment

To build the project and push the assets to Google Apps Script:

```bash
bun run push
```

> [!IMPORTANT]
> The `dist/` directory is the source of truth for `clasp push`. Avoid modifying files in `dist/` directly, as they are overwritten during the build process.
> The push script uses `clasp push --force`, so remote editor changes are overwritten by the local `dist/` contents.

## 📖 Command Reference

| Command             | Action                                                         |
| :------------------ | :------------------------------------------------------------- |
| `bun run dev`       | Starts the Vite development server with HMR.                   |
| `bun run build`     | Compiles source files and generates the `dist/` bundle.        |
| `bun run typecheck` | Type-checks the project with `tsc --noEmit`.                   |
| `bun run lint`      | Runs Oxlint linter.                                            |
| `bun run format`    | Formats code with Oxfmt.                                       |
| `bun run fmt:check` | Checks formatting with Oxfmt.                                  |
| `bun run push`      | Executes build and pushes files to the GAS project.            |
| `bun run deploy`    | Pushes changes and creates a new immutable version/deployment. |
| `bun run open`      | Opens the deployed Web App in your default browser.            |

## 📁 Project Structure

```text
.
├── src/
│   ├── web/                 # Browser runtime (React)
│   │   ├── index.html       # Web App entry point
│   │   ├── main.tsx         # React entry point
│   │   ├── App.tsx          # Root React component
│   │   ├── globals.css      # Tailwind CSS + shadcn/ui theming
│   │   ├── components/ui/   # shadcn/ui components (Base UI)
│   │   ├── lib/             # Utilities (cn(), google.script.run wrapper)
│   │   └── google-script-run.d.ts  # google.script.run type declarations
│   └── gas/                 # Apps Script runtime
│       ├── main.gs          # Server-side GAS logic
│       └── appsscript.json  # Manifest file
├── dist/                # Optimized build artifacts (Clasp target)
├── components.json      # shadcn/ui configuration (Base UI)
├── .clasp.json.example  # Example clasp config (rootDir: dist)
├── .oxlintrc.json       # Oxlint configuration
├── .oxfmtrc.json        # Oxfmt configuration
├── vite.config.ts       # Vite build configuration
└── .clasp.json          # Clasp project settings
```

## 🧩 shadcn/ui (Base UI)

This starter uses [shadcn/ui](https://ui.shadcn.com/) with [Base UI](https://base-ui.com/) (MUI) as the primitive library. Components live in `src/web/components/ui/` and are copied into the project as source code, so you can customize them freely.

To add a new component:

```bash
bunx shadcn@latest add button
```

New components use the Base UI primitives (`@base-ui/react/*`). The `components.json` configures the Base UI base and the `@/*` alias.

## 📡 Calling Apps Script from React

The template includes a type-safe wrapper for `google.script.run` in `src/web/lib/gas-run.ts`:

```ts
import { runFunction } from "@/lib/gas-run";

const time = await runFunction<string>("getServerTime");
```

Server-side functions are defined in `src/gas/main.gs` and exposed via `google.script.run`. The `src/web/google-script-run.d.ts` file provides type declarations for the injected `google.script` global.
