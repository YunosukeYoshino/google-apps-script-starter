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

`push` は `clasp push --force` を実行し、デプロイ先の編集内容をローカルの `dist/` で上書きします。Apps Script エディタで直接編集した内容が必要な場合は、先に退避してください。
