import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const repoRoot = path.resolve(import.meta.dir, "..");
const mainSource = fs.readFileSync(
	path.join(repoRoot, "sample-mcp/src/gas/main.gs"),
	"utf8",
);
const mcpSource = fs.readFileSync(
	path.join(repoRoot, "sample-mcp/src/gas/mcp.gs"),
	"utf8",
);

type McpEvent = {
	parameter?: Record<string, string>;
	postData?: { contents: string };
};

type SheetRow = string[];

class FakeRange {
	constructor(
		private readonly sheet: FakeSheet,
		private readonly row: number,
		private readonly column: number,
		private readonly numRows: number,
		private readonly numColumns: number,
	) {}

	setValues(values: string[][]): this {
		for (let rowOffset = 0; rowOffset < this.numRows; rowOffset += 1) {
			const targetRow = this.row - 1 + rowOffset;
			while (this.sheet.values.length <= targetRow) {
				this.sheet.values.push([]);
			}
			for (
				let columnOffset = 0;
				columnOffset < this.numColumns;
				columnOffset += 1
			) {
				this.sheet.values[targetRow][this.column - 1 + columnOffset] =
					values[rowOffset]?.[columnOffset] ?? "";
			}
		}
		return this;
	}
}

class FakeSheet {
	values: SheetRow[] = [];

	constructor(public name: string) {}

	setName(name: string): this {
		this.name = name;
		return this;
	}

	getRange(
		row: number,
		column: number,
		numRows: number,
		numColumns: number,
	): FakeRange {
		return new FakeRange(this, row, column, numRows, numColumns);
	}

	getDataRange(): {
		getDisplayValues(): string[][];
	} {
		const width = Math.max(0, ...this.values.map((row) => row.length), 4);
		const normalized = this.values.map((row) => {
			const copy = row.slice();
			while (copy.length < width) {
				copy.push("");
			}
			return copy;
		});
		return {
			getDisplayValues: () =>
				normalized.length > 0 ? normalized : [["", "", "", ""]],
		};
	}

	appendRow(row: SheetRow): void {
		this.values.push(row.map(String));
	}
}

class FakeSpreadsheet {
	sheets: FakeSheet[];

	constructor(
		public id: string,
		public title: string,
		sheetName = "Sheet1",
	) {
		this.sheets = [new FakeSheet(sheetName)];
	}

	getUrl(): string {
		return `https://docs.google.com/spreadsheets/d/${this.id}/edit`;
	}

	getId(): string {
		return this.id;
	}

	getSheets(): FakeSheet[] {
		return this.sheets;
	}

	getSheetByName(name: string): FakeSheet | null {
		return this.sheets.find((sheet) => sheet.name === name) ?? null;
	}

	insertSheet(name: string): FakeSheet {
		const sheet = new FakeSheet(name);
		this.sheets.push(sheet);
		return sheet;
	}
}

type McpHarness = {
	post(event: McpEvent): unknown;
	setup(): string[];
	spreadsheetId(): string | null;
};

type McpHarnessOptions = {
	deployedUrl?: string | null;
	token?: string | null;
	uuids?: string[];
	spreadsheetId?: string | null;
	seedRows?: SheetRow[];
};

class FakeTextOutput {
	constructor(private readonly content: string) {}

	getContent(): string {
		return this.content;
	}

	setMimeType(): this {
		return this;
	}
}

function createMcpHarness(options: McpHarnessOptions = {}): McpHarness {
	const properties = new Map<string, string>();
	if (options.token !== null) {
		properties.set("MCP_SHARED_SECRET", options.token ?? "secret-token");
	}
	if (options.spreadsheetId) {
		properties.set("MCP_SPREADSHEET_ID", options.spreadsheetId);
	}
	const logs: string[] = [];
	const uuids = [
		...(options.uuids ?? [
			"row-id-1",
			"uuid-a",
			"uuid-b",
			"sheet-id-1",
			"uuid-c",
			"uuid-d",
		]),
	];
	const spreadsheets = new Map<string, FakeSpreadsheet>();
	if (options.spreadsheetId) {
		const spreadsheet = new FakeSpreadsheet(
			options.spreadsheetId,
			"seeded",
			"Items",
		);
		spreadsheet.sheets[0].values = [
			["id", "title", "note", "created_at"],
			...(options.seedRows ?? []),
		];
		spreadsheets.set(options.spreadsheetId, spreadsheet);
	}

	const context = vm.createContext({
		ContentService: {
			MimeType: { JSON: "application/json", TEXT: "text/plain" },
			createTextOutput(content = "") {
				return new FakeTextOutput(content);
			},
		},
		HtmlService: {
			createHtmlOutputFromFile() {
				return {
					setTitle() {
						return this;
					},
					addMetaTag() {
						return this;
					},
				};
			},
		},
		LockService: {
			getScriptLock() {
				return {
					waitLock() {},
					releaseLock() {},
				};
			},
		},
		Logger: {
			log(message: unknown) {
				logs.push(String(message));
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
		ScriptApp: {
			getService() {
				return {
					getUrl() {
						return options.deployedUrl === undefined
							? "https://script.google.com/macros/s/deployment/exec"
							: options.deployedUrl;
					},
				};
			},
		},
		SpreadsheetApp: {
			create(title: string) {
				const id = uuids.shift() ?? `sheet-${spreadsheets.size + 1}`;
				const spreadsheet = new FakeSpreadsheet(id, title);
				spreadsheets.set(id, spreadsheet);
				return spreadsheet;
			},
			openById(id: string) {
				const spreadsheet = spreadsheets.get(id);
				if (!spreadsheet) {
					throw new Error(`Unknown spreadsheet: ${id}`);
				}
				return spreadsheet;
			},
		},
		Utilities: {
			getUuid: () => uuids.shift() ?? "uuid",
		},
	});
	vm.runInContext(`${mainSource}\n${mcpSource}`, context);

	function getFunction(name: string): (...args: unknown[]) => unknown {
		const candidate: unknown = context[name];
		if (typeof candidate !== "function") {
			throw new Error(`MCP sample must define ${name}`);
		}
		return (...args) => Reflect.apply(candidate, context, args);
	}
	const doPost = getFunction("doPost");

	return {
		post(event) {
			const output: unknown = doPost(event);
			if (!(output instanceof FakeTextOutput)) {
				throw new Error("doPost must return a ContentService TextOutput");
			}
			return JSON.parse(output.getContent());
		},
		setup() {
			logs.length = 0;
			getFunction("setupMcp_")();
			return [...logs];
		},
		spreadsheetId() {
			return properties.get("MCP_SPREADSHEET_ID") ?? null;
		},
	};
}

function callTool(
	mcp: McpHarness,
	name: string,
	args: Record<string, unknown> = {},
	token = "secret-token",
) {
	return mcp.post({
		parameter: { token },
		postData: {
			contents: JSON.stringify({
				jsonrpc: "2.0",
				id: 1,
				method: "tools/call",
				params: { name, arguments: args },
			}),
		},
	});
}

describe("spreadsheet MCP sample", () => {
	test("Spark can discover the spreadsheet tools", () => {
		const mcp = createMcpHarness({
			spreadsheetId: "sheet-seed",
		});

		const response = mcp.post({
			parameter: { token: "secret-token" },
			postData: {
				contents: JSON.stringify({
					jsonrpc: "2.0",
					id: 1,
					method: "tools/list",
				}),
			},
		}) as {
			result: { tools: Array<{ name: string }> };
		};

		expect(response.result.tools.map((tool) => tool.name)).toEqual([
			"list_rows",
			"lookup_by_key",
			"append_row",
		]);
	});

	test("setup creates a demo spreadsheet and connection URL", () => {
		const mcp = createMcpHarness({
			token: null,
			uuids: ["token-a", "token-b", "sheet-created"],
		});

		const logs = mcp.setup();

		expect(mcp.spreadsheetId()).toBe("sheet-created");
		expect(logs.some((line) => line.includes("MCP connection URL:"))).toBe(
			true,
		);
		expect(logs.some((line) => line.includes("Demo spreadsheet ID:"))).toBe(
			true,
		);
	});

	test("Spark can list seeded spreadsheet rows", () => {
		const mcp = createMcpHarness({
			spreadsheetId: "sheet-seed",
			seedRows: [
				["1", "Alpha", "first", "2026-08-12T00:00:00.000Z"],
				["2", "Beta", "second", "2026-08-12T01:00:00.000Z"],
			],
		});

		const response = callTool(mcp, "list_rows", { limit: 1 }) as {
			result: { content: Array<{ text: string }> };
		};
		const payload = JSON.parse(response.result.content[0].text) as {
			rows: Array<Record<string, string>>;
			totalRows: number;
		};

		expect(payload.totalRows).toBe(2);
		expect(payload.rows).toEqual([
			{
				id: "1",
				title: "Alpha",
				note: "first",
				created_at: "2026-08-12T00:00:00.000Z",
			},
		]);
	});

	test("Spark can look up a row by title", () => {
		const mcp = createMcpHarness({
			spreadsheetId: "sheet-seed",
			seedRows: [["1", "Alpha", "first", "2026-08-12T00:00:00.000Z"]],
		});

		const response = callTool(mcp, "lookup_by_key", {
			keyColumn: "title",
			key: "Alpha",
		}) as {
			result: { content: Array<{ text: string }> };
		};
		const payload = JSON.parse(response.result.content[0].text) as {
			found: boolean;
			row: Record<string, string> | null;
		};

		expect(payload).toEqual({
			found: true,
			row: {
				id: "1",
				title: "Alpha",
				note: "first",
				created_at: "2026-08-12T00:00:00.000Z",
			},
		});
	});

	test("Spark can append a validated row", () => {
		const mcp = createMcpHarness({
			spreadsheetId: "sheet-seed",
			uuids: ["new-row-id"],
		});

		const response = callTool(mcp, "append_row", {
			title: "  Hello  ",
			note: "world",
		}) as {
			result: { content: Array<{ text: string }> };
		};
		const payload = JSON.parse(response.result.content[0].text) as {
			appended: boolean;
			row: { id: string; title: string; note: string };
		};

		expect(payload.appended).toBe(true);
		expect(payload.row.id).toBe("new-row-id");
		expect(payload.row.title).toBe("Hello");
		expect(payload.row.note).toBe("world");

		const listed = callTool(mcp, "list_rows") as {
			result: { content: Array<{ text: string }> };
		};
		const listPayload = JSON.parse(listed.result.content[0].text) as {
			totalRows: number;
			rows: Array<{ title: string }>;
		};
		expect(listPayload.totalRows).toBe(1);
		expect(listPayload.rows[0].title).toBe("Hello");
	});

	test("Spark recovers when append_row is missing a title", () => {
		const mcp = createMcpHarness({
			spreadsheetId: "sheet-seed",
		});

		const response = callTool(mcp, "append_row", {}) as {
			result: { isError?: boolean; content: Array<{ text: string }> };
		};

		expect(response.result.isError).toBe(true);
		expect(response.result.content[0].text).toContain(
			"ツールの実行に失敗しました",
		);
	});
});
