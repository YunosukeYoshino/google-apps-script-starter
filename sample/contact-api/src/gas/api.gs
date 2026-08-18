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
