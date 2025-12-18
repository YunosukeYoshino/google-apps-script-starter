# GEMINI.md — Vite + clasp + Biome 開発ガイドライン

このプロジェクトは、Google Apps Script (GAS) を Vite + TypeScript で開発し、`clasp` を使用してデプロイするための構成になっています。

## プロジェクト概要

- **目的**: GAS Webアプリの開発
- **技術スタック**:
  - **Runtime**: Google Apps Script (V8)
  - **Frontend**: Vite (React/TypeScript), Tailwind CSS v4
  - **Tooling**: `clasp`, `biome` (Lint/Format), `bun`
- **ディレクトリ構造**:
  - `src/`: ソースコード（`.ts`, `.gs`, `.html`, `appsscript.json`）
  - `dist/`: ビルド成果物（clasp同期対象）
  - `.clasp.json`: clasp の設定ファイル

## ガイドライン参照

- **clasp 操作・デプロイ**: [.gemini/instructions/clasp.md](.gemini/instructions/clasp.md)
- **TypeScript 開発基準**: [.gemini/instructions/typescript.md](.gemini/instructions/typescript.md)
- **コードスタイル**: [.gemini/instructions/readable-code.md](.gemini/instructions/readable-code.md)
