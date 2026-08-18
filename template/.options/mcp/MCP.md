# Gemini Spark MCP Tools adapter

This project includes an experimental MCP Tools adapter for calling Apps
Script functions from Gemini Spark. It supports synchronous `tools/list` and
`tools/call` requests. It is not a general-purpose or fully compliant MCP
gateway.

## Set up

1. Log in and create the Apps Script project as described in `README.md`.
2. Run `bun run deploy` to push the build and create a Web app deployment.
3. Open the Apps Script editor with `bunx clasp open-script`.
4. Select `setupMcp` in the editor and run it once.
5. Copy the `MCP connection URL` from the execution log into Gemini Spark's
   custom MCP server configuration.

`setupMcp` keeps an existing token. Run `getMcpConnectionUrl_` to display the
current URL again, or `rotateMcpToken_` to invalidate it and create a new one.
Run these management functions only from the Apps Script editor.

## Add a tool

Edit `src/gas/mcp.gs` and add an entry to `MCP_TOOLS_` containing:

- a unique `name`;
- a `description` that tells the model when to use the tool;
- an `inputSchema` with required fields and their basic types;
- appropriate MCP `annotations` such as `readOnlyHint`;
- a `handler` that returns a string, object, or array.

Only explicitly registered handlers are exposed. Keep destructive or
high-impact actions out of this personal-testing adapter. If you add writes,
validate every input and add locking and idempotency in the handler.

## Verify the endpoint

Apps Script responds to the initial POST with a `302`. A compatible client must
follow it as a GET. Python's `urllib` does this correctly:

```python
import json
import urllib.request

url = "PASTE_THE_TOKENIZED_CONNECTION_URL"
body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": "ping"}).encode()
request = urllib.request.Request(
    url,
    data=body,
    headers={"Content-Type": "application/json"},
    method="POST",
)

with urllib.request.urlopen(request) as response:
    print(response.status, response.read().decode())
```

Expected response:

```text
200 {"jsonrpc":"2.0","id":1,"result":{}}
```

Avoid testing with `curl -L -X POST`: it can preserve POST across the `302`,
whereas the Apps Script response URL expects GET.

## Security and compatibility limits

- The manifest uses `ANYONE_ANONYMOUS` because Gemini Spark has no Google login.
- The token is carried in the URL because Apps Script cannot read request
  headers. Treat the complete connection URL as a password.
- URLs can leak through logs, history, screenshots, and copied configuration.
  Rotate the token immediately if exposure is possible.
- There is no built-in rate limit. A leaked token can consume Apps Script quota.
- Apps Script cannot return SSE, choose HTTP status codes, or implement standard
  MCP header authentication and sessions.
- Notifications receive HTTP 200 with an empty body instead of the specified
  HTTP 202 response.
- JSON-RPC batch requests, Resources, Prompts, server notifications, and
  pagination are not supported.
- The adapter negotiates MCP protocol versions `2025-03-26` and `2025-06-18`.
- Gemini Spark is the compatibility target. Other clients are best-effort.

This implementation was inspired by
[GASだけでMCPサーバーを立てる。中継サーバーなしでGemini Sparkから呼ばれるまで](https://zenn.dev/kimura0314/articles/gas-only-mcp-server).
Unlike that article's TOFU example, this adapter creates its token only through
an editor-run management function after deployment.

See the official [MCP lifecycle](https://modelcontextprotocol.io/specification/2025-06-18/basic/lifecycle)
and [Apps Script Web app manifest](https://developers.google.com/apps-script/manifest/web-app-api-executable)
documentation for the protocol and deployment constraints.
