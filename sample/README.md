# Greeting sample

ブラウザ側の TypeScript から `google.script.run` を使い、Apps Script の `getGreeting` 関数を呼び出す最小サンプルです。

## Structure

```text
src/
├── web/  # ブラウザで実行される TypeScript、HTML、CSS
└── gas/  # Apps Script で実行される .gs と manifest
```

## Run

リポジトリルートで依存関係をインストールしてから実行します。

```bash
bun install
bun run --cwd sample dev
bun run --cwd sample typecheck
bun run --cwd sample build
```

デプロイする場合は `.clasp.json.example` を `.clasp.json` にコピーして `scriptId` を設定し、次を実行します。

```bash
bun run --cwd sample push
```
