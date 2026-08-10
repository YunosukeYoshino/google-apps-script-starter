import { Clock } from "lucide-react";
import { useState } from "react";

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
	const [serverTime, setServerTime] = useState<string | null>(null);
	const [greeting, setGreeting] = useState<string | null>(null);
	const [loading, setLoading] = useState<"time" | "greeting" | null>(null);
	const [error, setError] = useState<string | null>(null);

	const call = async (kind: "time" | "greeting") => {
		setLoading(kind);
		setError(null);
		try {
			if (kind === "time") {
				const time = await runFunction<string>("getServerTime");
				setServerTime(time);
			} else {
				const message = await runFunction<string>("getGreeting", name);
				setGreeting(message);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setLoading(null);
		}
	};

	return (
		<main className="flex min-h-svh flex-col items-center justify-center bg-muted/40 p-6">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>GAS + React + shadcn/ui</CardTitle>
					<CardDescription>
						Vite + React 19 + Tailwind v4 + shadcn/ui（Base UI
						ベース）で構成された GAS Web App テンプレートです。
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<Input
						aria-label="名前"
						placeholder="name"
						value={name}
						onChange={(event) => setName(event.target.value)}
						maxLength={80}
					/>
					<div className="flex flex-col gap-2">
						<Button
							type="button"
							onClick={() => call("greeting")}
							disabled={loading !== null}
						>
							GAS を呼び出す
						</Button>
						<Button
							variant="outline"
							type="button"
							onClick={() => call("time")}
							disabled={loading !== null}
						>
							<Clock data-icon="inline-start" />
							サーバー時刻を取得
						</Button>
					</div>
					<p
						className="min-h-5 text-sm text-muted-foreground"
						aria-live="polite"
					>
						{error
							? `エラー: ${error}`
							: loading === "greeting"
								? "GAS を呼び出しています…"
								: greeting
									? greeting
									: loading === "time"
										? "サーバー時刻を取得中…"
										: serverTime
											? `サーバー時刻: ${serverTime}`
											: ""}
					</p>
				</CardContent>
				<CardFooter>
					<p className="text-xs text-muted-foreground">
						<code>google.script.run</code> で GAS 関数を呼び出します。
					</p>
				</CardFooter>
			</Card>
		</main>
	);
}
