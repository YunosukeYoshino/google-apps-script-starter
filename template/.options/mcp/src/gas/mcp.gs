/**
 * Gemini Sparkから呼び出すMCP Toolsアダプター。
 */
const MCP_TOKEN_PROPERTY_ = "MCP_SHARED_SECRET";
const MCP_SERVER_NAME_ = "my-gas-project";
const MCP_SERVER_VERSION_ = "1.0.0";
const MCP_FALLBACK_PROTOCOL_VERSION_ = "2025-06-18";
const MCP_SUPPORTED_PROTOCOL_VERSIONS_ = ["2025-06-18", "2025-03-26"];
const MCP_TOOLS_ = [
	{
		name: "get_server_time",
		description: "現在のサーバー時刻を確認したいと言われたときに使う。",
		inputSchema: { type: "object", properties: {} },
		annotations: { readOnlyHint: true },
		handler: function () {
			return new Date().toISOString();
		},
	},
	{
		name: "get_greeting",
		description: "指定した名前への挨拶を作ってほしいと言われたときに使う。",
		inputSchema: {
			type: "object",
			properties: { name: { type: "string" } },
			required: ["name"],
		},
		annotations: { readOnlyHint: true },
		handler: function (args) {
			const normalizedName = String(args.name || "")
				.trim()
				.slice(0, 80);
			const recipient = normalizedName || "world";
			return "こんにちは、" + recipient + "さん。";
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
 * デプロイ後に共有シークレットを初期化し、Spark接続URLをログへ表示します。
 */
function setupMcp_() {
	const properties = PropertiesService.getScriptProperties();
	let token = properties.getProperty(MCP_TOKEN_PROPERTY_);
	if (!token) {
		token = Utilities.getUuid() + Utilities.getUuid();
		properties.setProperty(MCP_TOKEN_PROPERTY_, token);
	}
	logMcpConnectionUrl_(token);
}

/**
 * setupMcp_ を実行します。アンダースコアで始まる関数はエディタの関数セレクタに
 * 表示されないため、公開用の別名を用意しています。
 */
function setupMcp() {
	setupMcp_();
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
