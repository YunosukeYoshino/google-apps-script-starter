import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const tools = [
	{
		name: "list_rows",
		summary: "Items シートの先頭から最大50行を読む",
	},
	{
		name: "lookup_by_key",
		summary: "id / title などのキーで1件探す",
	},
	{
		name: "append_row",
		summary: "title 必須で1行追記する",
	},
] as const;

export default function App() {
	return (
		<main className="flex min-h-svh flex-col items-center justify-center bg-muted/40 p-6">
			<Card className="w-full max-w-lg">
				<CardHeader>
					<CardTitle>Spreadsheet MCP sample</CardTitle>
					<CardDescription>
						この画面はセットアップ案内です。実操作は Gemini Spark から MCP Tools
						経由で行います。
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4 text-sm">
					<ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
						<li>
							<code>bun run deploy</code> で Web アプリをデプロイする
						</li>
						<li>
							Apps Script エディタで <code>setupMcp_</code> を1回実行する
						</li>
						<li>
							ログの MCP connection URL を Gemini Spark の custom MCP server
							に貼る
						</li>
					</ol>
					<ul className="space-y-2">
						{tools.map((tool) => (
							<li key={tool.name}>
								<code>{tool.name}</code>
								<span className="text-muted-foreground"> — {tool.summary}</span>
							</li>
						))}
					</ul>
					<p className="text-xs text-muted-foreground">
						詳細は <code>MCP.md</code> と <code>README.md</code>{" "}
						を参照してください。
					</p>
				</CardContent>
			</Card>
		</main>
	);
}
