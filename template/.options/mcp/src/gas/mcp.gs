/**
 * Gemini Sparkから呼び出すMCP Toolsアダプター。
 */
var MCP_TOKEN_PROPERTY_ = "MCP_SHARED_SECRET";
var MCP_SERVER_NAME_ = "my-gas-project";
var MCP_SERVER_VERSION_ = "1.0.0";
var MCP_FALLBACK_PROTOCOL_VERSION_ = "2025-06-18";
var MCP_SUPPORTED_PROTOCOL_VERSIONS_ = ["2025-06-18", "2025-03-26"];
var MCP_TOOLS_ = [
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
			var name = String(args.name || "")
				.trim()
				.slice(0, 80);
			return "こんにちは、" + (name || "world") + "さん。";
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

	var message;
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

	var response = handleMcpRpc_(message);
	return response === null ? mcpEmptyOutput_() : mcpJsonOutput_(response);
}

/**
 * @param {*} message JSON-RPCメッセージ
 * @return {*} JSON-RPCレスポンス
 */
function handleMcpRpc_(message) {
	var id = message && message.id;
	var method = message && message.method;
	var params = (message && message.params) || {};

	if (method === "initialize") {
		var requestedVersion = params.protocolVersion;
		var protocolVersion =
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

	if (method === "ping") {
		return mcpRpcResult_(id, {});
	}

	if (method === "tools/list") {
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

	if (method === "tools/call") {
		try {
			var value = runMcpTool_(params.name, params.arguments || {});
			return mcpRpcResult_(id, {
				content: [
					{
						type: "text",
						text: typeof value === "string" ? value : JSON.stringify(value),
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

	if (id === undefined || id === null) {
		return null;
	}
	return mcpRpcError_(id, -32601, "未対応のメソッドです。");
}

/**
 * @param {string} name ツール名
 * @param {Object<string, *>} args ツール引数
 * @return {*} ツール実行結果
 */
function runMcpTool_(name, args) {
	for (var index = 0; index < MCP_TOOLS_.length; index += 1) {
		var tool = MCP_TOOLS_[index];
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
	var required = tool.inputSchema.required || [];
	for (var index = 0; index < required.length; index += 1) {
		if (args[required[index]] === undefined) {
			throw new Error("必須の引数がありません: " + required[index]);
		}
	}

	var properties = tool.inputSchema.properties || {};
	var names = Object.keys(properties);
	for (
		var propertyIndex = 0;
		propertyIndex < names.length;
		propertyIndex += 1
	) {
		var name = names[propertyIndex];
		if (args[name] === undefined) {
			continue;
		}
		var expectedType = properties[name].type;
		var actualType = Array.isArray(args[name])
			? "array"
			: args[name] === null
				? "null"
				: typeof args[name];
		if (expectedType && actualType !== expectedType) {
			throw new Error("引数の型が正しくありません: " + name);
		}
	}
}

/**
 * @param {?string} token 受信した共有シークレット
 */
function checkMcpToken_(token) {
	var expected =
		PropertiesService.getScriptProperties().getProperty(MCP_TOKEN_PROPERTY_);
	if (!expected || !token || token !== expected) {
		throw new Error("認証に失敗しました。");
	}
}

/**
 * デプロイ後に共有シークレットを初期化し、Spark接続URLをログへ表示します。
 */
function setupMcp_() {
	var baseUrl = getMcpBaseUrl_();
	var properties = PropertiesService.getScriptProperties();
	var token = properties.getProperty(MCP_TOKEN_PROPERTY_);
	if (!token) {
		token = Utilities.getUuid() + Utilities.getUuid();
		properties.setProperty(MCP_TOKEN_PROPERTY_, token);
	}
	Logger.log(
		"MCP connection URL: " + baseUrl + "?token=" + encodeURIComponent(token),
	);
}

/**
 * 現在の共有シークレットを含むSpark接続URLをログへ表示します。
 */
function getMcpConnectionUrl_() {
	var token =
		PropertiesService.getScriptProperties().getProperty(MCP_TOKEN_PROPERTY_);
	if (!token) {
		throw new Error("先にsetupMcp_を実行してください。");
	}
	Logger.log(
		"MCP connection URL: " +
			getMcpBaseUrl_() +
			"?token=" +
			encodeURIComponent(token),
	);
}

/**
 * 共有シークレットを更新し、新しいSpark接続URLをログへ表示します。
 */
function rotateMcpToken_() {
	var baseUrl = getMcpBaseUrl_();
	var token = Utilities.getUuid() + Utilities.getUuid();
	PropertiesService.getScriptProperties().setProperty(
		MCP_TOKEN_PROPERTY_,
		token,
	);
	Logger.log(
		"MCP connection URL: " + baseUrl + "?token=" + encodeURIComponent(token),
	);
}

/**
 * @return {string} 匿名アクセス可能なWebアプリURL
 */
function getMcpBaseUrl_() {
	var url = ScriptApp.getService().getUrl();
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
 * @param {*} value JSONへ変換する値
 * @return {GoogleAppsScript.Content.TextOutput} JSONレスポンス
 */
function mcpJsonOutput_(value) {
	return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(
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
