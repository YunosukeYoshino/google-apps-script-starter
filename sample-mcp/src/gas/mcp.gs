/**
 * Gemini Sparkから呼び出すSpreadsheet向けMCP Toolsアダプター。
 */
const MCP_TOKEN_PROPERTY_ = "MCP_SHARED_SECRET";
const MCP_SPREADSHEET_ID_PROPERTY_ = "MCP_SPREADSHEET_ID";
const MCP_SERVER_NAME_ = "gas-spreadsheet-mcp-sample";
const MCP_SERVER_VERSION_ = "1.0.0";
const MCP_FALLBACK_PROTOCOL_VERSION_ = "2025-06-18";
const MCP_SUPPORTED_PROTOCOL_VERSIONS_ = ["2025-06-18", "2025-03-26"];
const MCP_SHEET_NAME_ = "Items";
const MCP_SHEET_HEADERS_ = ["id", "title", "note", "created_at"];
const MCP_LIST_DEFAULT_LIMIT_ = 20;
const MCP_LIST_MAX_LIMIT_ = 50;
const MCP_TITLE_MAX_LENGTH_ = 80;
const MCP_NOTE_MAX_LENGTH_ = 500;

const MCP_TOOLS_ = [
	{
		name: "list_rows",
		description:
			"メモ用スプレッドシートの先頭行から件数分を読みたいと言われたときに使う。",
		inputSchema: {
			type: "object",
			properties: {
				limit: {
					type: "number",
					description: "返す最大行数。省略時は20、上限は50。",
				},
			},
		},
		annotations: { readOnlyHint: true },
		handler: function (args) {
			return listSheetRows_(args);
		},
	},
	{
		name: "lookup_by_key",
		description:
			"idやtitleなどキー列の値でメモを1件探したいと言われたときに使う。",
		inputSchema: {
			type: "object",
			properties: {
				keyColumn: {
					type: "string",
					description: "検索する列名。id / title / note / created_at。",
				},
				key: {
					type: "string",
					description: "完全一致で探す値。",
				},
			},
			required: ["keyColumn", "key"],
		},
		annotations: { readOnlyHint: true },
		handler: function (args) {
			return lookupSheetRowByKey_(args);
		},
	},
	{
		name: "append_row",
		description:
			"メモ用スプレッドシートへ新しい行を1件足したいと言われたときに使う。",
		inputSchema: {
			type: "object",
			properties: {
				title: {
					type: "string",
					description: "必須の短いタイトル。",
				},
				note: {
					type: "string",
					description: "任意のメモ本文。",
				},
			},
			required: ["title"],
		},
		annotations: {
			readOnlyHint: false,
			destructiveHint: false,
			idempotentHint: false,
		},
		handler: function (args) {
			return appendSheetRow_(args);
		},
	},
];

/**
 * MCPのJSON-RPCリクエストを処理します。
 * @param {GoogleAppsScript.Events.DoPost} e POSTイベント
 * @return {GoogleAppsScript.Content.TextOutput} MCPレスポンス
 */
function doPost(e) {
	try {
		checkMcpToken_(e && e.parameter ? e.parameter.token : null);
	} catch (_error) {
		return mcpJsonOutput_(mcpRpcError_(null, -32001, "認証に失敗しました。"));
	}

	let message;
	try {
		message = JSON.parse(
			e && e.postData && e.postData.contents ? e.postData.contents : "",
		);
	} catch (_error) {
		return mcpJsonOutput_(
			mcpRpcError_(null, -32700, "JSONとして読めない本文です。"),
		);
	}
	if (Array.isArray(message)) {
		return mcpJsonOutput_(
			mcpRpcError_(null, -32600, "バッチリクエストは未対応です。"),
		);
	}

	const response = handleMcpRpc_(message);
	return response === null ? mcpEmptyOutput_() : mcpJsonOutput_(response);
}

/**
 * @param {*} message JSON-RPCメッセージ
 * @return {*} JSON-RPCレスポンス
 */
function handleMcpRpc_(message) {
	const id = message && message.id;
	const method = message && message.method;
	const params = (message && message.params) || {};

	if (method === "initialize") {
		return mcpInitializeResult_(id, params);
	}
	if (method === "ping") {
		return mcpRpcResult_(id, {});
	}
	if (method === "tools/list") {
		return mcpToolsListResult_(id);
	}
	if (method === "tools/call") {
		return mcpToolsCallResult_(id, params);
	}
	if (id === undefined || id === null) {
		return null;
	}
	return mcpRpcError_(id, -32601, "未対応のメソッドです。");
}

/**
 * @param {*} id JSON-RPC ID
 * @param {*} params initializeパラメータ
 * @return {*} JSON-RPCレスポンス
 */
function mcpInitializeResult_(id, params) {
	const requestedVersion = params.protocolVersion;
	const protocolVersion =
		MCP_SUPPORTED_PROTOCOL_VERSIONS_.indexOf(requestedVersion) >= 0
			? requestedVersion
			: MCP_FALLBACK_PROTOCOL_VERSION_;
	return mcpRpcResult_(id, {
		protocolVersion: protocolVersion,
		capabilities: { tools: { listChanged: false } },
		serverInfo: {
			name: MCP_SERVER_NAME_,
			version: MCP_SERVER_VERSION_,
		},
	});
}

/**
 * @param {*} id JSON-RPC ID
 * @return {*} JSON-RPCレスポンス
 */
function mcpToolsListResult_(id) {
	return mcpRpcResult_(id, {
		tools: MCP_TOOLS_.map(function (tool) {
			return {
				name: tool.name,
				description: tool.description,
				inputSchema: tool.inputSchema,
				annotations: tool.annotations,
			};
		}),
	});
}

/**
 * @param {*} id JSON-RPC ID
 * @param {*} params tools/callパラメータ
 * @return {*} JSON-RPCレスポンス
 */
function mcpToolsCallResult_(id, params) {
	try {
		const toolResult = runMcpTool_(params.name, params.arguments || {});
		return mcpRpcResult_(id, {
			content: [
				{
					type: "text",
					text:
						typeof toolResult === "string"
							? toolResult
							: JSON.stringify(toolResult),
				},
			],
		});
	} catch (error) {
		Logger.log(error && error.stack ? error.stack : String(error));
		return mcpRpcResult_(id, {
			content: [
				{
					type: "text",
					text: "ツールの実行に失敗しました。入力値を確認してください。",
				},
			],
			isError: true,
		});
	}
}

/**
 * @param {string} name ツール名
 * @param {Object<string, *>} args ツール引数
 * @return {*} ツール実行結果
 */
function runMcpTool_(name, args) {
	for (let index = 0; index < MCP_TOOLS_.length; index += 1) {
		const tool = MCP_TOOLS_[index];
		if (tool.name === name) {
			validateMcpToolArgs_(tool, args);
			return tool.handler(args);
		}
	}
	throw new Error("未知のツールです。");
}

/**
 * @param {*} tool ツール定義
 * @param {Object<string, *>} args ツール引数
 */
function validateMcpToolArgs_(tool, args) {
	const required = tool.inputSchema.required || [];
	for (let index = 0; index < required.length; index += 1) {
		if (args[required[index]] === undefined) {
			throw new Error("必須の引数がありません: " + required[index]);
		}
	}

	const properties = tool.inputSchema.properties || {};
	const names = Object.keys(properties);
	for (
		let propertyIndex = 0;
		propertyIndex < names.length;
		propertyIndex += 1
	) {
		const name = names[propertyIndex];
		if (args[name] === undefined) {
			continue;
		}
		const expectedType = properties[name].type;
		if (expectedType && mcpArgumentType_(args[name]) !== expectedType) {
			throw new Error("引数の型が正しくありません: " + name);
		}
	}
}

/**
 * @param {*} argument JSON-RPCツール引数
 * @return {string} JSON Schemaのtype名
 */
function mcpArgumentType_(argument) {
	if (Array.isArray(argument)) {
		return "array";
	}
	if (argument === null) {
		return "null";
	}
	return typeof argument;
}

/**
 * @param {?string} token 受信した共有シークレット
 */
function checkMcpToken_(token) {
	const expected =
		PropertiesService.getScriptProperties().getProperty(MCP_TOKEN_PROPERTY_);
	if (!expected || !token || token !== expected) {
		throw new Error("認証に失敗しました。");
	}
}

/**
 * デプロイ後に共有シークレットとデモ用シートを初期化し、接続URLをログへ表示します。
 */
function setupMcp_() {
	const properties = PropertiesService.getScriptProperties();
	let token = properties.getProperty(MCP_TOKEN_PROPERTY_);
	if (!token) {
		token = Utilities.getUuid() + Utilities.getUuid();
		properties.setProperty(MCP_TOKEN_PROPERTY_, token);
	}
	ensureDemoSpreadsheet_();
	logMcpConnectionUrl_(token);
}

/**
 * 現在の共有シークレットを含むSpark接続URLをログへ表示します。
 */
function getMcpConnectionUrl_() {
	const token =
		PropertiesService.getScriptProperties().getProperty(MCP_TOKEN_PROPERTY_);
	if (!token) {
		throw new Error("先にsetupMcp_を実行してください。");
	}
	logMcpConnectionUrl_(token);
}

/**
 * 共有シークレットを更新し、新しいSpark接続URLをログへ表示します。
 */
function rotateMcpToken_() {
	const token = Utilities.getUuid() + Utilities.getUuid();
	PropertiesService.getScriptProperties().setProperty(
		MCP_TOKEN_PROPERTY_,
		token,
	);
	logMcpConnectionUrl_(token);
}

/**
 * @param {string} token 共有シークレット
 */
function logMcpConnectionUrl_(token) {
	Logger.log(
		"MCP connection URL: " +
			getMcpBaseUrl_() +
			"?token=" +
			encodeURIComponent(token),
	);
	const spreadsheetId = PropertiesService.getScriptProperties().getProperty(
		MCP_SPREADSHEET_ID_PROPERTY_,
	);
	if (spreadsheetId) {
		Logger.log("Demo spreadsheet ID: " + spreadsheetId);
	}
}

/**
 * @return {string} 匿名アクセス可能なWebアプリURL
 */
function getMcpBaseUrl_() {
	const url = ScriptApp.getService().getUrl();
	if (!url) {
		throw new Error("先にWebアプリをデプロイしてください。");
	}
	return url.replace(/\/a\/[^/]+\/macros\//, "/macros/");
}

/**
 * @return {GoogleAppsScript.Spreadsheet.Sheet} Itemsシート
 */
function getItemsSheet_() {
	const spreadsheetId = PropertiesService.getScriptProperties().getProperty(
		MCP_SPREADSHEET_ID_PROPERTY_,
	);
	if (!spreadsheetId) {
		throw new Error("先にsetupMcp_を実行してください。");
	}
	const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
	const sheet = spreadsheet.getSheetByName(MCP_SHEET_NAME_);
	if (!sheet) {
		throw new Error("シート " + MCP_SHEET_NAME_ + " が見つかりません。");
	}
	return sheet;
}

/**
 * デモ用スプレッドシートが無ければ作成し、Script Propertiesへ保存します。
 * @return {string} スプレッドシートID
 */
function ensureDemoSpreadsheet_() {
	const properties = PropertiesService.getScriptProperties();
	const existingId = properties.getProperty(MCP_SPREADSHEET_ID_PROPERTY_);
	if (existingId) {
		const existing = SpreadsheetApp.openById(existingId);
		if (!existing.getSheetByName(MCP_SHEET_NAME_)) {
			const sheet = existing.insertSheet(MCP_SHEET_NAME_);
			sheet
				.getRange(1, 1, 1, MCP_SHEET_HEADERS_.length)
				.setValues([MCP_SHEET_HEADERS_]);
		}
		return existingId;
	}

	const spreadsheet = SpreadsheetApp.create("MCP Spreadsheet sample");
	const defaultSheet = spreadsheet.getSheets()[0];
	defaultSheet.setName(MCP_SHEET_NAME_);
	defaultSheet
		.getRange(1, 1, 1, MCP_SHEET_HEADERS_.length)
		.setValues([MCP_SHEET_HEADERS_]);
	const spreadsheetId = spreadsheet.getId();
	properties.setProperty(MCP_SPREADSHEET_ID_PROPERTY_, spreadsheetId);
	Logger.log("Created demo spreadsheet: " + spreadsheet.getUrl());
	return spreadsheetId;
}

/**
 * @param {Object<string, *>} args list_rows引数
 * @return {{headers: string[], rows: Object<string, string>[], totalRows: number}}
 */
function listSheetRows_(args) {
	const limit = normalizeListLimit_(args.limit);
	const sheet = getItemsSheet_();
	const values = sheet.getDataRange().getDisplayValues();
	if (values.length <= 1) {
		return { headers: MCP_SHEET_HEADERS_.slice(), rows: [], totalRows: 0 };
	}
	const headers = values[0].map(String);
	const dataRows = values.slice(1);
	const rows = dataRows.slice(0, limit).map(function (row) {
		return rowToObject_(headers, row);
	});
	return {
		headers: headers,
		rows: rows,
		totalRows: dataRows.length,
	};
}

/**
 * @param {Object<string, *>} args lookup_by_key引数
 * @return {{found: boolean, row: ?Object<string, string>}}
 */
function lookupSheetRowByKey_(args) {
	const keyColumn = String(args.keyColumn || "")
		.trim()
		.toLowerCase();
	const key = String(args.key || "").trim();
	if (!keyColumn || !key) {
		throw new Error("keyColumn と key は必須です。");
	}
	if (MCP_SHEET_HEADERS_.indexOf(keyColumn) < 0) {
		throw new Error("未知の列名です: " + keyColumn);
	}

	const sheet = getItemsSheet_();
	const values = sheet.getDataRange().getDisplayValues();
	if (values.length <= 1) {
		return { found: false, row: null };
	}
	const headers = values[0].map(function (header) {
		return String(header).toLowerCase();
	});
	const columnIndex = headers.indexOf(keyColumn);
	if (columnIndex < 0) {
		throw new Error("シートに列がありません: " + keyColumn);
	}
	for (let rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
		if (String(values[rowIndex][columnIndex]).trim() === key) {
			return {
				found: true,
				row: rowToObject_(values[0].map(String), values[rowIndex]),
			};
		}
	}
	return { found: false, row: null };
}

/**
 * @param {Object<string, *>} args append_row引数
 * @return {{appended: boolean, row: Object<string, string>}}
 */
function appendSheetRow_(args) {
	const title = String(args.title || "")
		.trim()
		.slice(0, MCP_TITLE_MAX_LENGTH_);
	if (!title) {
		throw new Error("title は必須です。");
	}
	const note = String(args.note || "")
		.trim()
		.slice(0, MCP_NOTE_MAX_LENGTH_);
	const row = {
		id: Utilities.getUuid(),
		title: title,
		note: note,
		created_at: new Date().toISOString(),
	};

	const lock = LockService.getScriptLock();
	lock.waitLock(10000);
	try {
		const sheet = getItemsSheet_();
		sheet.appendRow([row.id, row.title, row.note, row.created_at]);
	} finally {
		lock.releaseLock();
	}
	return { appended: true, row: row };
}

/**
 * @param {*} limit 要求された件数
 * @return {number} 正規化した件数
 */
function normalizeListLimit_(limit) {
	if (limit === undefined || limit === null || limit === "") {
		return MCP_LIST_DEFAULT_LIMIT_;
	}
	const parsed = Number(limit);
	if (!isFinite(parsed) || parsed < 1) {
		throw new Error("limit は1以上の数値である必要があります。");
	}
	return Math.min(Math.floor(parsed), MCP_LIST_MAX_LIMIT_);
}

/**
 * @param {string[]} headers ヘッダー行
 * @param {*[]} row データ行
 * @return {Object<string, string>} 列名付きオブジェクト
 */
function rowToObject_(headers, row) {
	const result = {};
	for (let index = 0; index < headers.length; index += 1) {
		result[headers[index]] = row[index] === undefined ? "" : String(row[index]);
	}
	return result;
}

/**
 * @param {*} id JSON-RPC ID
 * @param {number} code エラーコード
 * @param {string} message エラーメッセージ
 * @return {{jsonrpc: string, id: *, error: {code: number, message: string}}}
 */
function mcpRpcError_(id, code, message) {
	return {
		jsonrpc: "2.0",
		id: id === undefined ? null : id,
		error: { code: code, message: message },
	};
}

/**
 * @param {*} id JSON-RPC ID
 * @param {*} result 結果
 * @return {{jsonrpc: string, id: *, result: *}}
 */
function mcpRpcResult_(id, result) {
	return { jsonrpc: "2.0", id: id, result: result };
}

/**
 * @param {*} payload JSONへ変換する値
 * @return {GoogleAppsScript.Content.TextOutput} JSONレスポンス
 */
function mcpJsonOutput_(payload) {
	return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
		ContentService.MimeType.JSON,
	);
}

/**
 * GASでは通知へ202を返せないため、200の空本文で応答します。
 * @return {GoogleAppsScript.Content.TextOutput} 空レスポンス
 */
function mcpEmptyOutput_() {
	return ContentService.createTextOutput("").setMimeType(
		ContentService.MimeType.TEXT,
	);
}
