import { Send } from "lucide-react";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { runFunction } from "@/lib/gas-run";

export default function App() {
	const [name, setName] = useState("");
	const [greeting, setGreeting] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();
		setLoading(true);
		setError(null);
		try {
			const message = await runFunction<string>("getGreeting", name);
			setGreeting(message);
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="flex min-h-svh flex-col items-center justify-center bg-muted/40 p-6">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Greeting sample</CardTitle>
					<CardDescription>
						ブラウザのTypeScriptから <code>google.script.run</code>{" "}
						を使ってGAS関数を呼び出します。
					</CardDescription>
				</CardHeader>
				<form onSubmit={handleSubmit}>
					<CardContent className="flex flex-col gap-4">
						<Input
							aria-label="名前"
							placeholder="name"
							value={name}
							onChange={(event) => setName(event.target.value)}
							maxLength={80}
						/>
						<Button type="submit" disabled={loading}>
							<Send data-icon="inline-start" />
							GAS を呼び出す
						</Button>
						<p
							className="min-h-5 text-sm text-muted-foreground"
							aria-live="polite"
						>
							{error
								? `エラー: ${error}`
								: loading
									? "GAS を呼び出しています…"
									: greeting}
						</p>
					</CardContent>
				</form>
				<CardFooter>
					<p className="text-xs text-muted-foreground">
						React 19 + Tailwind v4 + shadcn/ui（Base UI ベース）構成です。
					</p>
				</CardFooter>
			</Card>
		</main>
	);
}
