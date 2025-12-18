# clasp + TypeScript 開発ガイドライン

このプロジェクトは、Google Apps Script (GAS) をローカル環境で TypeScript を用いて開発し、`clasp` を使用して管理・デプロイするための構成になっています。

## 開発サイクル 【MUST】

1.  **コードの修正**: `src/` 配下のファイルを編集する。
2.  **同期 (Push)**:
    ```bash
    bunx clasp push
    ```
    ※ TypeScript ファイルは push 時に自動的に `.gs` へ変換されます。
3.  **デプロイ**:
    ```bash
    bunx clasp deploy --description "変更内容のメモ"
    ```
4.  **動作確認**:
    WebアプリのURLにアクセスして確認する。最新のURLは以下のコマンドで取得可能：
    ```bash
    bunx clasp deployments
    ```

## 開発上の注意点 【SHOULD】

- **アクセス権限**: Webアプリを公開する場合、`src/appsscript.json` の `webapp.access` を `ANYONE` に設定する必要があります。
- **グローバル関数**: `doGet` や `doPost` などのエントリポイント、およびスプレッドシートから呼び出す関数は、TypeScript の `export` を使わず、トップレベルの通常の関数として定義してください。
- **HTMLの配信**: `HtmlService.createTemplateFromFile("index")` を使用する場合、`src/index.html` が参照されます。
- **依存関係**: 新しいライブラリ（npmパッケージ）を追加しても、GASのランタイムでは直接動きません。GAS用のライブラリを使用するか、Web側であれば CDN 経由で読み込んでください。

## 便利なコマンド

- `bunx clasp open`: ブラウザで GAS エディタを開く
- `bunx clasp logs --watch`: 実行ログをリアルタイムで確認する
- `bunx clasp status`: 同期対象ファイルの確認
