# Spreadsheet MCP sample

Gemini Spark 向けの実験的 MCP Tools アダプターです。同期の `tools/list` と
`tools/call` だけを扱います。汎用 MCP ゲートウェイではありません。

## Set up

1. `README.md` の手順で Apps Script プロジェクトを作成する。
2. `bun run deploy` でビルドを push し、Web app をデプロイする。
3. `bunx clasp open-script` でエディタを開き、`setupMcp` を1回実行する。
4. 実行ログの `MCP connection URL` を Gemini Spark の custom MCP server 設定へコピーする。

`setupMcp` は既存トークンを保持し、未作成ならデモ用スプレッドシート
（シート名 `Items`）を作成します。`getMcpConnectionUrl_` で URL を再表示し、
`rotateMcpToken_` でトークンを更新できます。管理関数はエディタからだけ実行してください。

## Tools

- `list_rows` — `{ limit?: number }`。先頭から最大50行を返す。
- `lookup_by_key` — `{ keyColumn: string, key: string }`。完全一致で1件探す。
- `append_row` — `{ title: string, note?: string }`。`id` と `created_at` を付与して追記する。

破壊的操作は含めていません。追記は入力を正規化し、`LockService` で排他します。

## Security and compatibility limits

- マニフェストは `ANYONE_ANONYMOUS` です。Gemini Spark に Google ログインがないためです。
- トークンは URL クエリに載せます。接続 URL 全体をパスワード扱いにしてください。
- レート制限はありません。漏洩したらすぐに `rotateMcpToken_` してください。
- Apps Script は SSE、任意の HTTP ステータス、標準 MCP ヘッダー認証に対応しません。
- 通知は仕様の HTTP 202 ではなく、空本文の HTTP 200 で返します。
- バッチ JSON-RPC、Resources、Prompts、server notifications、pagination は未対応です。
- 対応プロトコルは `2025-03-26` と `2025-06-18` です。
