# Project Overview — Vite + clasp + Biome

Google Apps Script (GAS) Webアプリを Vite + TypeScript で開発し、`clasp` でデプロイする構成。

## 技術スタック

| Category | Technology |
|----------|------------|
| Runtime | Google Apps Script (V8) |
| Frontend | Vite (React/TypeScript), Tailwind CSS v4 |
| Tooling | clasp, Biome (Lint/Format), bun |

## ディレクトリ構造

- `src/`: ソースコード（`.ts`, `.gs`, `.html`, `appsscript.json`）
- `dist/`: ビルド成果物（clasp 同期対象）
- `.clasp.json`: clasp 設定

## ガイドライン参照

| Topic | File |
|-------|------|
| clasp 操作・デプロイ | `.rules/clasp-guide.md` |
| TypeScript 開発基準 | `.rules/typescript.md` |
| コードスタイル | `.rules/readable-code.md` |
| コードレビュー | `.rules/styleguide.md` |
