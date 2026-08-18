/**
 * お問い合わせフォームの送信データ型
 */
export interface ContactFormData {
	name: string;
	email: string;
	category?: string;
	message: string;
	honeypot?: string;
	turnstileToken?: string;
}

/**
 * お問い合わせAPIのレスポンス型
 */
export interface ContactApiResponse {
	success: boolean;
	message: string;
	timestamp?: string;
	version?: string;
	status?: string;
}

/**
 * 既存WebサイトからGASのWeb Appエンドポイントにお問い合わせデータを送信します。
 *
 * @param endpointUrl GASのデプロイURL (例: https://script.google.com/macros/s/.../exec)
 * @param data お問い合わせ入力データ
 * @returns レスポンスJSON
 */
export async function sendContactForm(
	endpointUrl: string,
	data: ContactFormData,
): Promise<ContactApiResponse> {
	// CORSプリフライト（OPTIONSリクエスト）を発生させないため text/plain を指定
	const response = await fetch(endpointUrl, {
		method: "POST",
		headers: {
			"Content-Type": "text/plain;charset=utf-8",
		},
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
	}

	const result: ContactApiResponse = await response.json();
	return result;
}

/**
 * GAS Web Appの稼働ステータスとバージョンを確認します。
 * （ブラウザのGET CORS制限を回避するため POST ping を使用）
 *
 * @param endpointUrl GASのデプロイURL
 * @returns ヘルスチェック結果
 */
export async function checkHealth(
	endpointUrl: string,
): Promise<ContactApiResponse> {
	const response = await fetch(endpointUrl, {
		method: "POST",
		headers: {
			"Content-Type": "text/plain;charset=utf-8",
		},
		body: JSON.stringify({ action: "ping" }),
	});

	if (!response.ok) {
		throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
	}

	const result: ContactApiResponse = await response.json();
	return result;
}
