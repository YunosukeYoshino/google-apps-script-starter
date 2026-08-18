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
		const category = String(data.category ?? "").trim() || "未指定";
		const message = String(data.message ?? "").trim();
		const honeypot = String(data.honeypot ?? "").trim();

		// ハニーポット（非表示フィールド）に値がある場合はbotとみなして無視（成功を偽装）
		if (honeypot) {
			return createJsonResponse({
				success: true,
				message: "お問い合わせを受け付けました。",
			});
		}

		if (!name || !email || !message) {
			return createJsonResponse({
				success: false,
				message:
					"必須項目（お名前、メールアドレス、メッセージ）が不足しています。",
			});
		}

		// 設定値の取得
		const scriptProperties = PropertiesService.getScriptProperties();
		const turnstileSecret = scriptProperties.getProperty(
			"TURNSTILE_SECRET_KEY",
		);
		const allowedHostname = scriptProperties.getProperty(
			"TURNSTILE_ALLOWED_HOSTNAME",
		);

		// Cloudflare Turnstile認証が設定されている場合の検証
		if (turnstileSecret) {
			const turnstileToken = String(data.turnstileToken ?? "").trim();
			if (!turnstileToken) {
				return createJsonResponse({
					success: false,
					message: "認証トークンが指定されていません。",
				});
			}

			const verifyResult = verifyTurnstileToken(
				turnstileSecret,
				turnstileToken,
			);
			if (!verifyResult.success) {
				return createJsonResponse({
					success: false,
					message: "認証に失敗しました。再度お試しください。",
				});
			}

			if (allowedHostname && verifyResult.hostname !== allowedHostname) {
				return createJsonResponse({
					success: false,
					message: "許可されていないオリジンからの認証リクエストです。",
				});
			}
		}

		const spreadsheetId = scriptProperties.getProperty("SPREADSHEET_ID");
		const sheetName =
			scriptProperties.getProperty("SHEET_NAME") || "お問い合わせ";
		const adminEmail = scriptProperties.getProperty("ADMIN_EMAIL");

		// スプレッドシートへの記録
		let ss = null;
		if (spreadsheetId) {
			ss = SpreadsheetApp.openById(spreadsheetId);
		} else {
			try {
				ss = SpreadsheetApp.getActiveSpreadsheet();
			} catch (_e) {
				// 単体Webアプリ等でアクティブシートがない場合はスキップ
			}
		}

		const now = new Date();
		const formattedDate = Utilities.formatDate(
			now,
			"Asia/Tokyo",
			"yyyy/MM/dd HH:mm:ss",
		);

		if (ss) {
			const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
			if (sheet.getLastRow() === 0) {
				sheet.appendRow([
					"日時",
					"お名前",
					"メールアドレス",
					"種別",
					"お問い合わせ内容",
				]);
			}
			sheet.appendRow([formattedDate, name, email, category, message]);
		}

		// 管理者向け通知メール
		if (adminEmail) {
			GmailApp.sendEmail(
				adminEmail,
				`【お問い合わせ】${name} 様より`,
				`Webサイトから新しいお問い合わせを受信しました。\n\n` +
					`■ 日時: ${formattedDate}\n` +
					`■ お名前: ${name}\n` +
					`■ メールアドレス: ${email}\n` +
					`■ 種別: ${category}\n\n` +
					`■ お問い合わせ内容:\n${message}`,
			);
		}

		// ユーザー向け自動返信メール
		if (email) {
			GmailApp.sendEmail(
				email,
				"【自動返信】お問い合わせを受け付けました",
				`${name} 様\n\n` +
					`お問い合わせありがとうございます。以下の内容で受け付けいたしました。\n\n` +
					`----------------------------------------\n` +
					`■ お名前: ${name}\n` +
					`■ 種別: ${category}\n` +
					`■ お問い合わせ内容:\n${message}\n` +
					`----------------------------------------\n\n` +
					`内容を確認の上、担当者より順次ご連絡差し上げます。`,
			);
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

/**
 * Cloudflare Turnstileトークンを照合・検証します。
 * @param {string} secretKey
 * @param {string} token
 * @return {{ success: boolean, hostname?: string, errorCodes?: string[] }}
 */
function verifyTurnstileToken(secretKey, token) {
	try {
		const response = UrlFetchApp.fetch(
			"https://challenges.cloudflare.com/turnstile/v0/siteverify",
			{
				method: "post",
				payload: {
					secret: secretKey,
					response: token,
				},
				muteHttpExceptions: true,
			},
		);

		const result = JSON.parse(response.getContentText());
		return {
			success: Boolean(result.success),
			hostname: result.hostname,
			errorCodes: result["error-codes"],
		};
	} catch (e) {
		console.error("Turnstile verification error:", e);
		return { success: false };
	}
}
