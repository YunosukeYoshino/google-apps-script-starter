# clasp + Vite 開発ガイドライン

clasp 3.x では TypeScript の transpile は行われません。Vite で `dist/` にビルドしてから push します。

- Source: https://github.com/google/clasp/blob/master/README.md#drop-typescript-support
- Source: https://github.com/google/clasp/blob/master/README.md#rootdir-optional

## 初回セットアップ 【MUST】

1. clasp にログイン:
   ```bash
   bunx clasp login
   ```
2. Webアプリプロジェクトを作成（`rootDir` は `dist`）:
   ```bash
   bunx clasp create --type webapp --rootDir ./dist --title "My GAS Web App"
   ```
   `.clasp.json` が生成され、`rootDir` が `dist` になります。
3. 手動で設定する場合は `.clasp.json.example` を `.clasp.json` にコピーし、`scriptId` を設定:
   ```bash
   cp .clasp.json.example .clasp.json
   ```

## 開発サイクル 【MUST】

1. **コードの修正**: ブラウザ側は `src/web/`、Apps Script 側は `src/gas/` を編集する。
2. **ビルド + 同期 (Push)**:
   ```bash
   bun run push
   ```
   `bun run build` で Vite が `dist/` を生成し、その後 `clasp push` が実行されます。
3. **デプロイ**:
   ```bash
   bun run deploy
   ```
4. **動作確認**:
   ```bash
   bun run open
   bun run deployments
   ```

## 開発上の注意点 【SHOULD】

- **push 対象**: clasp は `.clasp.json` の `rootDir`（`dist/`）のみを push します。`src/` は直接 push されません。
- **強制同期**: `bun run push` は `clasp push --force` を実行し、Apps Script エディタ上の変更をローカルの `dist/` で上書きする。
- **アクセス権限**: 公開 Webアプリは `src/gas/appsscript.json` の `webapp.access` を `ANYONE` に設定する。
- **サーバー関数**: `doGet` / `doPost` およびスプレッドシートから呼ぶ関数は `src/gas/main.gs` にトップレベル関数として定義する（`export` 不可）。
- **HTML の配信**: `HtmlService.createHtmlOutputFromFile("index")` は push 後の `dist/index.html` を参照する（ソースは `src/web/index.html`）。
- **依存関係**: npm パッケージは GAS ランタイムでは動きません。GAS ライブラリか Web 側 CDN を使う。

## 便利なコマンド

- `bunx clasp open-script`: GAS エディタを開く
- `bunx clasp logs --watch`: 実行ログをリアルタイム確認
- `bunx clasp status`: push 対象ファイルの確認
