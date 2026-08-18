/**
 * GETリクエストに対する疎通確認（ヘルスチェック）レスポンスを返します。
 * @return {GoogleAppsScript.Content.TextOutput}
 */
function doGet() {
	const payload = {
		success: true,
		status: "ok",
		version: "1.0.0",
		timestamp: new Date().toISOString(),
	};

	return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
		ContentService.MimeType.JSON,
	);
}

/**
 * 外部WebサイトからのPOSTリクエストを処理します。
 * @param {GoogleAppsScript.Events.DoPost} e
 * @return {GoogleAppsScript.Content.TextOutput}
 */
function doPost(e) {
	try {
		if (!e || !e.postData || !e.postData.contents) {
			return createJsonResponse({
				success: false,
				message: "リクエストボディが空です。",
			});
		}

		let data;
		try {
			data = JSON.parse(e.postData.contents);
		} catch (_err) {
			return createJsonResponse({
				success: false,
				message: "無効なJSONフォーマットです。",
			});
		}

		if (typeof data !== "object" || data === null) {
			return createJsonResponse({
				success: false,
				message: "リクエストデータが無効です。",
			});
		}

		const name = String(data.name ?? "").trim();
		const email = String(data.email ?? "").trim();
		const message = String(data.message ?? "").trim();

		if (!name || !email || !message) {
			return createJsonResponse({
				success: false,
				message: "必須項目（お名前、メールアドレス、メッセージ）が不足しています。",
			});
		}

		return createJsonResponse({
			success: true,
			message: "お問い合わせを受け付けました。",
		});
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		console.error("doPost Error:", errorMessage);
		return createJsonResponse({
			success: false,
			message: "サーバー内部エラーが発生しました。",
		});
	}
}

/**
 * JSONレスポンス生成ヘルパー
 * @param {object} payload
 * @return {GoogleAppsScript.Content.TextOutput}
 */
function createJsonResponse(payload) {
	return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
		ContentService.MimeType.JSON,
	);
}
