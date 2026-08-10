# Project Overview — Vite + clasp + Oxc

Google Apps Script (GAS) Webアプリを Vite + TypeScript で開発し、`clasp` でデプロイする構成。

## 技術スタック

| Category | Technology                                 |
| -------- | ------------------------------------------ |
| Runtime  | Google Apps Script (V8)                    |
| Frontend | Vite (React 19), Tailwind CSS v4, shadcn/ui (Base UI) |
| Tooling  | clasp, Oxlint (Lint), Oxfmt (Format), bun  |

## ディレクトリ構造

- `src/web/`: ブラウザ側ソースコード（`.ts`, `.html`, `.css`）
- `src/gas/`: Apps Script 側ソースコード（`.gs`, `appsscript.json`）
- `dist/`: ビルド成果物（clasp 同期対象）
- `.clasp.json`: clasp 設定

## ガイドライン参照

| Topic                | File                      |
| -------------------- | ------------------------- |
| clasp 操作・デプロイ | `.rules/clasp-guide.md`   |
| TypeScript 開発基準  | `.rules/typescript.md`    |
| コードスタイル       | `.rules/readable-code.md` |
| コードレビュー       | `.rules/styleguide.md`    |
