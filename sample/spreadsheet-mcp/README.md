# Spreadsheet MCP sample

Gemini Spark から Apps Script の MCP Tools 経由でスプレッドシートを読む・追記するサンプルです。

ブラウザ UI はセットアップ案内のみです。実操作は Spark 側の tool call で行います。

## Tools

| Tool            | 内容                                            |
| --------------- | ----------------------------------------------- |
| `list_rows`     | `Items` シートの先頭行を読む（既定20 / 上限50） |
| `lookup_by_key` | `id` / `title` などのキーで1件探す              |
| `append_row`    | `title` 必須で1行追記する（`LockService` あり） |

シート列は `id`, `title`, `note`, `created_at` です。`setupMcp_` がデモ用スプレッドシートを作成します。

## Structure

```text
src/
├── web/  # セットアップ案内の React UI
└── gas/  # MCP adapter（mcp.gs）と Web app entry（main.gs）
```

## Run

```bash
cd sample/spreadsheet-mcp
bun install
bun run typecheck
bun run build
```

デプロイする場合は `.clasp.json.example` を `.clasp.json` にコピーして `scriptId` を設定し、次を実行します。

```bash
bunx clasp login
bunx clasp create --type webapp --rootDir ./dist --title "MCP Spreadsheet sample"
bun run deploy
```

その後 Apps Script エディタで `setupMcp_` を実行し、ログの connection URL を Gemini Spark に設定します。手順の詳細は [`MCP.md`](MCP.md) を参照してください。
