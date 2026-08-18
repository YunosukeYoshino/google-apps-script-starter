import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const repoRoot = path.resolve(import.meta.dir, "..");
const apiSourcePath = path.join(repoRoot, "sample/contact-api/src/gas/api.gs");

type FakeEmail = {
	body: string;
	subject: string;
	to: string;
};

class FakeTextOutput {
	private mimeType = "";

	constructor(private readonly content: string) {}

	getContent(): string {
		return this.content;
	}

	getMimeType(): string {
		return this.mimeType;
	}

	setMimeType(mimeType: string): this {
		this.mimeType = mimeType;
		return this;
	}
}

class FakeSheet {
	values: string[][] = [];

	constructor(public name: string) {}

	appendRow(row: string[]): this {
		this.values.push([...row]);
		return this;
	}

	getLastRow(): number {
		return this.values.length;
	}
}

class FakeSpreadsheet {
	sheets: FakeSheet[] = [];

	constructor(public id: string) {}

	getSheetByName(name: string): FakeSheet | null {
		return this.sheets.find((s) => s.name === name) ?? null;
	}

	insertSheet(name: string): FakeSheet {
		const sheet = new FakeSheet(name);
		this.sheets.push(sheet);
		return sheet;
	}
}

type HarnessOptions = {
	properties?: Record<string, string>;
	urlFetchResponse?: {
		content: string;
		code?: number;
	};
};

function createApiHarness(options: HarnessOptions = {}) {
	const properties = new Map<string, string>(
		Object.entries(options.properties ?? {}),
	);
	const sentEmails: FakeEmail[] = [];
	const spreadsheets = new Map<string, FakeSpreadsheet>();
	const fetchCalls: Array<{ url: string; params?: unknown }> = [];

	const context = vm.createContext({
		ContentService: {
			MimeType: { JSON: "application/json", TEXT: "text/plain" },
			createTextOutput(content = "") {
				return new FakeTextOutput(content);
			},
		},
		GmailApp: {
			sendEmail(to: string, subject: string, body: string) {
				sentEmails.push({ to, subject, body });
			},
		},
		MailApp: {
			sendEmail(mailOptions: { to: string; subject: string; body: string }) {
				sentEmails.push({ ...mailOptions });
			},
		},
		PropertiesService: {
			getScriptProperties() {
				return {
					getProperty(key: string) {
						return properties.get(key) ?? null;
					},
					setProperty(key: string, value: string) {
						properties.set(key, value);
					},
				};
			},
		},
		SpreadsheetApp: {
			openById(id: string) {
				let ss = spreadsheets.get(id);
				if (!ss) {
					ss = new FakeSpreadsheet(id);
					spreadsheets.set(id, ss);
				}
				return ss;
			},
			getActiveSpreadsheet() {
				let ss = spreadsheets.get("active");
				if (!ss) {
					ss = new FakeSpreadsheet("active");
					spreadsheets.set("active", ss);
				}
				return ss;
			},
		},
		UrlFetchApp: {
			fetch(url: string, params?: unknown) {
				fetchCalls.push({ url, params });
				return {
					getContentText() {
						return (
							options.urlFetchResponse?.content ??
							JSON.stringify({ success: true })
						);
					},
					getResponseCode() {
						return options.urlFetchResponse?.code ?? 200;
					},
				};
			},
		},
		Utilities: {
			formatDate(date: Date, _timeZone: string, _format: string) {
				return date.toISOString();
			},
		},
		console,
	});

	if (fs.existsSync(apiSourcePath)) {
		const source = fs.readFileSync(apiSourcePath, "utf8");
		vm.runInContext(source, context);
	}

	return {
		get(event: unknown = {}) {
			context.event = event;
			return vm.runInContext("doGet(event)", context);
		},
		post(event: unknown = {}) {
			context.event = event;
			return vm.runInContext("doPost(event)", context);
		},
		sentEmails,
		spreadsheets,
		fetchCalls,
	};
}

describe("Contact API - doGet", () => {
	test("returns JSON health check status with version", () => {
		const harness = createApiHarness();
		const output = harness.get({});
		const json = JSON.parse(output.getContent());

		expect(json.success).toBe(true);
		expect(json.version).toBeDefined();
		expect(output.getMimeType()).toBe("application/json");
	});
});

describe("Contact API - doPost validation", () => {
	test("returns health check info when action is ping", () => {
		const harness = createApiHarness();
		const output = harness.post({
			postData: { contents: JSON.stringify({ action: "ping" }) },
		});
		const json = JSON.parse(output.getContent());

		expect(json.success).toBe(true);
		expect(json.status).toBe("ok");
		expect(json.version).toBe("1.0.0");
	});

	test("returns error when request body is empty", () => {
		const harness = createApiHarness();
		const output = harness.post({});
		const json = JSON.parse(output.getContent());

		expect(json.success).toBe(false);
		expect(json.message).toContain("リクエストボディ");
		expect(output.getMimeType()).toBe("application/json");
	});

	test("returns error when JSON parsing fails", () => {
		const harness = createApiHarness();
		const output = harness.post({ postData: { contents: "invalid-json" } });
		const json = JSON.parse(output.getContent());

		expect(json.success).toBe(false);
		expect(json.message).toContain("無効なJSON");
	});

	test("returns error when required fields are missing", () => {
		const harness = createApiHarness();
		const output = harness.post({
			postData: { contents: JSON.stringify({ name: "Alice" }) },
		});
		const json = JSON.parse(output.getContent());

		expect(json.success).toBe(false);
		expect(json.message).toContain("必須項目");
	});
});

describe("Contact API - doPost normal flow", () => {
	test("saves to spreadsheet and sends notification & auto-reply emails", () => {
		const harness = createApiHarness({
			properties: {
				SPREADSHEET_ID: "test-sheet-id",
				SHEET_NAME: "お問い合わせ",
				ADMIN_EMAIL: "admin@example.com",
			},
		});

		const payload = {
			name: "山田 太郎",
			email: "taro@example.com",
			category: "お見積り",
			message: "料金プランについて教えてください。",
		};

		const output = harness.post({
			postData: { contents: JSON.stringify(payload) },
		});
		const json = JSON.parse(output.getContent());

		expect(json.success).toBe(true);
		expect(json.message).toContain("受け付けました");

		// スプレッドシートの検証
		const ss = harness.spreadsheets.get("test-sheet-id");
		expect(ss).toBeDefined();
		const sheet = ss?.getSheetByName("お問い合わせ");
		expect(sheet).toBeDefined();
		expect(sheet?.values.length).toBe(2); // ヘッダー + 1行データ
		expect(sheet?.values[0]).toEqual([
			"日時",
			"お名前",
			"メールアドレス",
			"種別",
			"お問い合わせ内容",
		]);
		expect(sheet?.values[1][1]).toBe("山田 太郎");
		expect(sheet?.values[1][2]).toBe("taro@example.com");
		expect(sheet?.values[1][3]).toBe("お見積り");
		expect(sheet?.values[1][4]).toBe("料金プランについて教えてください。");

		// 送信メールの検証
		expect(harness.sentEmails.length).toBe(2);

		// 管理者向け
		const adminMail = harness.sentEmails.find(
			(m) => m.to === "admin@example.com",
		);
		expect(adminMail).toBeDefined();
		expect(adminMail?.subject).toContain("山田 太郎");
		expect(adminMail?.body).toContain("料金プランについて教えてください。");

		// ユーザー向け自動返信
		const userMail = harness.sentEmails.find(
			(m) => m.to === "taro@example.com",
		);
		expect(userMail).toBeDefined();
		expect(userMail?.subject).toContain("自動返信");
		expect(userMail?.body).toContain("山田 太郎");
	});

	test("silently ignores submission and does not send email when honeypot is filled", () => {
		const harness = createApiHarness({
			properties: {
				SPREADSHEET_ID: "test-sheet-id",
				SHEET_NAME: "お問い合わせ",
				ADMIN_EMAIL: "admin@example.com",
			},
		});

		const payload = {
			name: "Spam Bot",
			email: "bot@spam.com",
			message: "Buy cheap meds now!",
			honeypot: "I am a bot",
		};

		const output = harness.post({
			postData: { contents: JSON.stringify(payload) },
		});
		const json = JSON.parse(output.getContent());

		expect(json.success).toBe(true);

		// スプレッドシートに保存されていないこと
		const ss = harness.spreadsheets.get("test-sheet-id");
		expect(ss?.sheets.length ?? 0).toBe(0);

		// メールが送信されていないこと
		expect(harness.sentEmails.length).toBe(0);
	});
});

describe("Contact API - Turnstile verification", () => {
	test("fails when TURNSTILE_SECRET_KEY is set but token is missing", () => {
		const harness = createApiHarness({
			properties: {
				TURNSTILE_SECRET_KEY: "0x4AAAAAA...",
			},
		});

		const payload = {
			name: "Bob",
			email: "bob@example.com",
			message: "Hello",
		};

		const output = harness.post({
			postData: { contents: JSON.stringify(payload) },
		});
		const json = JSON.parse(output.getContent());

		expect(json.success).toBe(false);
		expect(json.message).toContain("認証");
	});

	test("fails when Cloudflare rejects the turnstile token", () => {
		const harness = createApiHarness({
			properties: {
				TURNSTILE_SECRET_KEY: "0x4AAAAAA...",
			},
			urlFetchResponse: {
				content: JSON.stringify({
					success: false,
					"error-codes": ["invalid-input-response"],
				}),
			},
		});

		const payload = {
			name: "Bob",
			email: "bob@example.com",
			message: "Hello",
			turnstileToken: "invalid-token",
		};

		const output = harness.post({
			postData: { contents: JSON.stringify(payload) },
		});
		const json = JSON.parse(output.getContent());

		expect(json.success).toBe(false);
		expect(json.message).toContain("認証に失敗");
		expect(harness.fetchCalls.length).toBe(1);
		expect(harness.fetchCalls[0].url).toContain("cloudflare.com/turnstile");
	});

	test("fails when hostname does not match TURNSTILE_ALLOWED_HOSTNAME", () => {
		const harness = createApiHarness({
			properties: {
				TURNSTILE_SECRET_KEY: "0x4AAAAAA...",
				TURNSTILE_ALLOWED_HOSTNAME: "my-site.com",
			},
			urlFetchResponse: {
				content: JSON.stringify({ success: true, hostname: "evil-site.com" }),
			},
		});

		const payload = {
			name: "Bob",
			email: "bob@example.com",
			message: "Hello",
			turnstileToken: "valid-token-wrong-host",
		};

		const output = harness.post({
			postData: { contents: JSON.stringify(payload) },
		});
		const json = JSON.parse(output.getContent());

		expect(json.success).toBe(false);
		expect(json.message).toContain("許可されていないオリジン");
	});

	test("succeeds when Cloudflare validates token and hostname matches", () => {
		const harness = createApiHarness({
			properties: {
				SPREADSHEET_ID: "test-sheet-id",
				ADMIN_EMAIL: "admin@example.com",
				TURNSTILE_SECRET_KEY: "0x4AAAAAA...",
				TURNSTILE_ALLOWED_HOSTNAME: "my-site.com",
			},
			urlFetchResponse: {
				content: JSON.stringify({ success: true, hostname: "my-site.com" }),
			},
		});

		const payload = {
			name: "Bob",
			email: "bob@example.com",
			message: "Hello",
			turnstileToken: "valid-token",
		};

		const output = harness.post({
			postData: { contents: JSON.stringify(payload) },
		});
		const json = JSON.parse(output.getContent());

		expect(json.success).toBe(true);
		expect(json.message).toContain("受け付けました");
		expect(harness.sentEmails.length).toBe(2);
	});
});
