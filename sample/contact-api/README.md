# Contact Form Web API Sample

既存のWebサイト（React、Vue、Next.js、WordPress、静的HTMLなど）から `fetch` でリクエストを受け取り、Googleスプレッドシートへの記録とメール通知（管理者通知 ＆ 自動返信）を行うサーバーレスなWeb APIエンドポイントのサンプルです。

---

## 主な機能

- **`doPost(e)` による問い合わせ受信**:
  - スプレッドシートへの自動追記（ヘッダー行の自動生成対応）
  - 管理者への通知メール送信
  - 問い合わせ者への自動返信メール送信
- **スパム・ボット対策（Proxyサーバー不要）**:
  - **ハニーポット**: 人間には見えないダミーフィールドによる簡易bot除外
  - **Cloudflare Turnstile**: サーバーサイドトークン検証により、外部スクリプトやcurlからのURL直叩きを完全遮断
- **CORSプリフライト対策**:
  - `Content-Type: text/plain` を使用することで `OPTIONS` プリフライトを回避し、GAS Web Appsで確実に受信

---

## スクリプトプロパティ（環境変数）

GASの **「プロジェクトの設定」>「スクリプト プロパティ」**、または `PropertiesService` で以下を設定します。

| プロパティ名                 | 必須 | 説明                                                             | 例                  |
| :--------------------------- | :--- | :--------------------------------------------------------------- | :------------------ |
| `SPREADSHEET_ID`             | 任意 | 書き込み先スプレッドシートID（未設定時はアクティブシートを使用） | `1BxiMVs0XR...`     |
| `SHEET_NAME`                 | 任意 | シート名（デフォルト: `お問い合わせ`）                           | `お問い合わせ一覧`  |
| `ADMIN_EMAIL`                | 任意 | 管理者宛ての通知先メールアドレス                                 | `admin@example.com` |
| `TURNSTILE_SECRET_KEY`       | 任意 | Cloudflare Turnstile の Secret Key（設定すると認証必須化）       | `0x4AAAAAA...`      |
| `TURNSTILE_ALLOWED_HOSTNAME` | 任意 | Turnstileを許可するドメイン名（別サイトからの悪用防止）          | `your-website.com`  |

---

## デプロイ手順

### 1. claspの設定とプッシュ

```bash
# 依存関係インストール
bun install

# .clasp.json を作成して scriptId を設定
cp .clasp.json.example .clasp.json
# .clasp.json の scriptId を書き換え

# ビルド ＆ GASへプッシュ
bun run push
```

### 2. ウェブアプリとしてデプロイ

```bash
# 初回デプロイ
bunx clasp deploy --description "v1.0.0 - Contact API"
```

発行された **Web App URL** (`https://script.google.com/macros/s/.../exec`) を控えます。

---

## 既存Webサイトへの組み込み方法

### クライアントコード（TypeScript / JavaScript）

```typescript
import { sendContactForm } from "./client";

const GAS_ENDPOINT_URL =
	"https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";

async function onSubmit(formData) {
	try {
		const result = await sendContactForm(GAS_ENDPOINT_URL, {
			name: formData.name,
			email: formData.email,
			category: formData.category,
			message: formData.message,
			honeypot: formData.honeypot, // 隠しフィールド
			turnstileToken: formData.turnstileToken, // Turnstile利用時
		});

		if (result.success) {
			alert("お問い合わせを送信しました。");
		} else {
			alert("送信に失敗しました: " + result.message);
		}
	} catch (error) {
		console.error("通信エラー:", error);
	}
}
```

### プリフライト（CORS）を回避するポイント

ブラウザからGAS Web Appへ直接通信する際、`Content-Type: application/json` を指定するとブラウザが `OPTIONS` リクエスト（プリフライト）を送信しますが、GASは `OPTIONS` に対応していません。

そのため、`headers: { "Content-Type": "text/plain;charset=utf-8" }` として送信し、GAS側で `JSON.parse(e.postData.contents)` するのが標準的な手法です。

---

## Proxyサーバーの要否について

- **結論**: 専用のProxy（プロキシ）サーバーがなくても、**Cloudflare Turnstile（無料）のサーバーサイド検証**を組み合わせることで、URLの直叩きやスパムbotを完全に防止できます。
- さらにGASのURL自体を完全に秘匿したい場合や、厳密なIP単位のレートリミットをかけたい場合は、Cloudflare Workers 等を前段に置く構成も可能です。
