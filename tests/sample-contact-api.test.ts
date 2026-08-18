import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const repoRoot = path.resolve(import.meta.dir, "..");
const apiSourcePath = path.join(
	repoRoot,
	"sample/contact-api/src/gas/api.gs",
);

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
	const fetchCalls: Array<{ url: string; params?: any }> = [];

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
			sendEmail(options: { to: string; subject: string; body: string }) {
				sentEmails.push({ ...options });
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
			fetch(url: string, params?: any) {
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
		get(event: any = {}) {
			context.event = event;
			return vm.runInContext("doGet(event)", context);
		},
		post(event: any = {}) {
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
