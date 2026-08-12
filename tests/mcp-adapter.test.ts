import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const repoRoot = path.resolve(import.meta.dir, "..");
const mainSource = fs.readFileSync(
	path.join(repoRoot, "template/src/gas/main.gs"),
	"utf8",
);
const mcpSource = fs.readFileSync(
	path.join(repoRoot, "template/.options/mcp/src/gas/mcp.gs"),
	"utf8",
);

type McpEvent = {
	parameter?: Record<string, string>;
	postData?: { contents: string };
};

type McpHarness = {
	connectionUrl(): string[];
	post(event: McpEvent): unknown;
	postText(event: McpEvent): string;
	rotate(): string[];
	setup(): string[];
};

type McpHarnessOptions = {
	deployedUrl?: string | null;
	token?: string | null;
	uuids?: string[];
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
	const logs: string[] = [];
	const uuids = [...(options.uuids ?? ["uuid"])];
	const context = vm.createContext({
		ContentService: {
			MimeType: { JSON: "application/json", TEXT: "text/plain" },
			createTextOutput(content = "") {
				return new FakeTextOutput(content);
			},
		},
		HtmlService: {},
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
		Utilities: { getUuid: () => uuids.shift() ?? "uuid" },
	});
	vm.runInContext(`${mainSource}\n${mcpSource}`, context);

	function getFunction(name: string): (...args: unknown[]) => unknown {
		const candidate: unknown = context[name];
		if (typeof candidate !== "function") {
			throw new Error(`MCP template must define ${name}`);
		}
		return (...args) => Reflect.apply(candidate, context, args);
	}
	const doPost = getFunction("doPost");

	function runOperatorFunction(name: string): string[] {
		logs.length = 0;
		getFunction(name)();
		return [...logs];
	}

	return {
		connectionUrl() {
			return runOperatorFunction("getMcpConnectionUrl_");
		},
		post(event) {
			return JSON.parse(this.postText(event));
		},
		postText(event) {
			const output: unknown = doPost(event);
			if (!(output instanceof FakeTextOutput)) {
				throw new Error("doPost must return a ContentService TextOutput");
			}
			return output.getContent();
		},
		rotate() {
			return runOperatorFunction("rotateMcpToken_");
		},
		setup() {
			return runOperatorFunction("setupMcp_");
		},
	};
}

describe("generated MCP adapter", () => {
	test("client receives the same authentication error for a missing token", () => {
		const mcp = createMcpHarness();

		expect(
			mcp.post({
				postData: {
					contents: JSON.stringify({
						jsonrpc: "2.0",
						id: 1,
						method: "ping",
					}),
				},
			}),
		).toEqual({
			jsonrpc: "2.0",
			id: null,
			error: { code: -32001, message: "認証に失敗しました。" },
		});
	});

	test("client receives a parse error for a malformed JSON body", () => {
		const mcp = createMcpHarness();

		expect(
			mcp.post({
				parameter: { token: "secret-token" },
				postData: { contents: "not-json" },
			}),
		).toEqual({
			jsonrpc: "2.0",
			id: null,
			error: { code: -32700, message: "JSONとして読めない本文です。" },
		});
	});

	test("Spark can initialize the generated MCP adapter", () => {
		const mcp = createMcpHarness();

		expect(
			mcp.post({
				parameter: { token: "secret-token" },
				postData: {
					contents: JSON.stringify({
						jsonrpc: "2.0",
						id: 1,
						method: "initialize",
						params: { protocolVersion: "2025-03-26" },
					}),
				},
			}),
		).toEqual({
			jsonrpc: "2.0",
			id: 1,
			result: {
				protocolVersion: "2025-03-26",
				capabilities: { tools: { listChanged: false } },
				serverInfo: { name: "my-gas-project", version: "1.0.0" },
			},
		});
	});

	test("server does not claim support for an unknown protocol version", () => {
		const mcp = createMcpHarness();

		const response = mcp.post({
			parameter: { token: "secret-token" },
			postData: {
				contents: JSON.stringify({
					jsonrpc: "2.0",
					id: 1,
					method: "initialize",
					params: { protocolVersion: "2099-01-01" },
				}),
			},
		});

		expect(response).toHaveProperty("result.protocolVersion", "2025-06-18");
	});

	test("Spark can ping the generated MCP adapter", () => {
		const mcp = createMcpHarness();

		expect(
			mcp.post({
				parameter: { token: "secret-token" },
				postData: {
					contents: JSON.stringify({
						jsonrpc: "2.0",
						id: 2,
						method: "ping",
					}),
				},
			}),
		).toEqual({ jsonrpc: "2.0", id: 2, result: {} });
	});

	test("Spark can discover the generated read-only tools", () => {
		const mcp = createMcpHarness();

		expect(
			mcp.post({
				parameter: { token: "secret-token" },
				postData: {
					contents: JSON.stringify({
						jsonrpc: "2.0",
						id: 3,
						method: "tools/list",
					}),
				},
			}),
		).toEqual({
			jsonrpc: "2.0",
			id: 3,
			result: {
				tools: [
					{
						name: "get_server_time",
						description: "現在のサーバー時刻を確認したいと言われたときに使う。",
						inputSchema: { type: "object", properties: {} },
						annotations: { readOnlyHint: true },
					},
					{
						name: "get_greeting",
						description:
							"指定した名前への挨拶を作ってほしいと言われたときに使う。",
						inputSchema: {
							type: "object",
							properties: { name: { type: "string" } },
							required: ["name"],
						},
						annotations: { readOnlyHint: true },
					},
				],
			},
		});
	});

	test("Spark can call a generated tool with arguments", () => {
		const mcp = createMcpHarness();

		expect(
			mcp.post({
				parameter: { token: "secret-token" },
				postData: {
					contents: JSON.stringify({
						jsonrpc: "2.0",
						id: 4,
						method: "tools/call",
						params: {
							name: "get_greeting",
							arguments: { name: " Ada " },
						},
					}),
				},
			}),
		).toEqual({
			jsonrpc: "2.0",
			id: 4,
			result: {
				content: [{ type: "text", text: "こんにちは、Adaさん。" }],
			},
		});
	});

	test("Spark can recover when tool arguments are invalid", () => {
		const mcp = createMcpHarness();

		expect(
			mcp.post({
				parameter: { token: "secret-token" },
				postData: {
					contents: JSON.stringify({
						jsonrpc: "2.0",
						id: 5,
						method: "tools/call",
						params: {
							name: "get_greeting",
							arguments: {},
						},
					}),
				},
			}),
		).toEqual({
			jsonrpc: "2.0",
			id: 5,
			result: {
				content: [
					{
						type: "text",
						text: "ツールの実行に失敗しました。入力値を確認してください。",
					},
				],
				isError: true,
			},
		});
	});

	test("Spark cannot call a tool with the wrong argument type", () => {
		const mcp = createMcpHarness();

		expect(
			mcp.post({
				parameter: { token: "secret-token" },
				postData: {
					contents: JSON.stringify({
						jsonrpc: "2.0",
						id: 6,
						method: "tools/call",
						params: {
							name: "get_greeting",
							arguments: { name: 42 },
						},
					}),
				},
			}),
		).toEqual({
			jsonrpc: "2.0",
			id: 6,
			result: {
				content: [
					{
						type: "text",
						text: "ツールの実行に失敗しました。入力値を確認してください。",
					},
				],
				isError: true,
			},
		});
	});

	test("client receives a JSON-RPC error for an unknown request method", () => {
		const mcp = createMcpHarness();

		expect(
			mcp.post({
				parameter: { token: "secret-token" },
				postData: {
					contents: JSON.stringify({
						jsonrpc: "2.0",
						id: 7,
						method: "resources/list",
					}),
				},
			}),
		).toEqual({
			jsonrpc: "2.0",
			id: 7,
			error: { code: -32601, message: "未対応のメソッドです。" },
		});
	});

	test("Spark receives an empty body for an initialized notification", () => {
		const mcp = createMcpHarness();

		expect(
			mcp.postText({
				parameter: { token: "secret-token" },
				postData: {
					contents: JSON.stringify({
						jsonrpc: "2.0",
						method: "notifications/initialized",
					}),
				},
			}),
		).toBe("");
	});

	test("client receives an explicit error for an unsupported batch request", () => {
		const mcp = createMcpHarness();

		expect(
			mcp.post({
				parameter: { token: "secret-token" },
				postData: {
					contents: JSON.stringify([{ jsonrpc: "2.0", id: 1, method: "ping" }]),
				},
			}),
		).toEqual({
			jsonrpc: "2.0",
			id: null,
			error: { code: -32600, message: "バッチリクエストは未対応です。" },
		});
	});

	test("developer can set up a tokenized connection URL after deployment", () => {
		const mcp = createMcpHarness({
			deployedUrl:
				"https://script.google.com/a/example.com/macros/s/deployment/exec",
			token: null,
			uuids: ["uuid-one", "uuid-two"],
		});

		expect(mcp.setup()).toEqual([
			"MCP connection URL: https://script.google.com/macros/s/deployment/exec?token=uuid-oneuuid-two",
		]);
	});

	test("developer can recover the current connection URL", () => {
		const mcp = createMcpHarness({ token: "existing-token" });

		expect(mcp.connectionUrl()).toEqual([
			"MCP connection URL: https://script.google.com/macros/s/deployment/exec?token=existing-token",
		]);
	});

	test("setup preserves an existing shared token", () => {
		const mcp = createMcpHarness({
			token: "existing-token",
			uuids: ["unused-one", "unused-two"],
		});

		expect(mcp.setup()).toEqual([
			"MCP connection URL: https://script.google.com/macros/s/deployment/exec?token=existing-token",
		]);
	});

	test("developer can explicitly rotate the shared token", () => {
		const mcp = createMcpHarness({
			token: "existing-token",
			uuids: ["new-uuid-one", "new-uuid-two"],
		});

		expect(mcp.rotate()).toEqual([
			"MCP connection URL: https://script.google.com/macros/s/deployment/exec?token=new-uuid-onenew-uuid-two",
		]);
	});

	test("developer is told to deploy before MCP setup", () => {
		const mcp = createMcpHarness({ deployedUrl: null, token: null });

		expect(() => mcp.setup()).toThrow("先にWebアプリをデプロイしてください。");
	});
});
