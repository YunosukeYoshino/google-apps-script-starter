# Google Apps Script Starter

A starter template for Google Apps Script development with TypeScript, Vite, and Tailwind CSS.

## Quick Start

You can create a new project using `npx`:

```bash
npx @yunosukeyoshino/google-apps-script-starter my-gas-project
```

Or if you prefer a shorter command after it's published:

```bash
npx create-gas-starter my-gas-project
```

## Features

[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-v7.0-646CFF?logo=vite)](https://vitejs.dev/)
[![Biome](https://img.shields.io/badge/Biome-v2.0-60A5FA?logo=biome)](https://biomejs.dev/)
[![clasp](https://img.shields.io/badge/clasp-v3.0-4285F4?logo=google-apps-script)](https://github.com/google/clasp)

A professional boilerplate for developing Google Apps Script (GAS) web applications using modern web development standards. This starter leverages Vite for rapid development and Tailwind CSS v4 for sophisticated styling, while maintaining a single-file deployment optimized for the GAS environment.

## 🛠 Tech Stack

The project integrates high-performance tools to ensure a robust developer experience and clean code quality.

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Runtime** | Google Apps Script | V8 Engine environment. |
| **Bundler** | [Vite 7](https://vitejs.dev/) | Next-generation frontend tooling for HMR and optimized builds. |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | High-performance, CSS-first design framework. |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Type-safe development for both frontend and server-side. |
| **Tooling** | [Biome](https://biomejs.dev/) | High-speed, all-in-one tool for linting and formatting. |
| **Deployment**| [clasp](https://github.com/google/clasp) | Command-line utility to manage Apps Script projects. |
| **Manager** | [Bun](https://bun.sh/) | Fast JavaScript all-in-one toolkit. |

## ✨ Key Features

- **Optimized Assets**: Automatically inlines JS and CSS into a single HTML file using `vite-plugin-singlefile`, ensuring seamless integration with GAS `HtmlService`.
- **Modern Workflow**: Local development server with Hot Module Replacement (HMR) for the UI.
- **Strict Quality Control**: Pre-configured Biome rules and Husky git hooks to maintain high standards for every commit.
- **Unified Structure**: All source files (Frontend, Backend, Configuration) are co-located in the `src/` directory for better maintainability.

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed on your machine.
- Access to [script.google.com](https://script.google.com/).

### Installation

1. Clone the repository and install dependencies:
   ```bash
   bun install
   ```

2. Authenticate with clasp (if not already):
   ```bash
   bunx clasp login
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

## 📖 Command Reference

| Command | Action |
| :--- | :--- |
| `bun run build` | Compiles source files and generates the `dist/` bundle. |
| `bun run push` | Executes build and pushes files to the GAS project. |
| `bun run deploy` | Pushes changes and creates a new immutable version/deployment. |
| `bun run open` | Opens the deployed Web App in your default browser. |
| `bun run lint:fix` | Runs Biome's linter and applies automatic fixes. |

## 📁 Project Structure

```text
.
├── src/
│   ├── index.html       # Web App entry point
│   ├── main.ts          # Client-side TypeScript
│   ├── style.css        # Tailwind CSS imports
│   ├── main.gs          # Server-side GAS logic
│   └── appsscript.json  # Manifest file
├── dist/                # Optimized build artifacts (Clasp target)
├── biome.json           # Biome configuration
├── vite.config.ts       # Vite build configuration
└── .clasp.json          # Clasp project settings
```
