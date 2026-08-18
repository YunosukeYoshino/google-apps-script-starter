import { AlertCircle, CheckCircle2, RefreshCw, Send } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import {
	type ContactApiResponse,
	type ContactFormData,
	checkHealth,
	sendContactForm,
} from "./client";

export default function App() {
	const [apiUrl, setApiUrl] = useState("");
	const [formData, setFormData] = useState<ContactFormData>({
		name: "",
		email: "",
		category: "ご質問・ご相談",
		message: "",
		honeypot: "",
	});
	const [loading, setLoading] = useState(false);
	const [checkingHealth, setCheckingHealth] = useState(false);
	const [response, setResponse] = useState<ContactApiResponse | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleHealthCheck = async () => {
		if (!apiUrl || apiUrl.includes("YOUR_DEPLOYMENT_ID")) {
			setError(
				"GAS Web Appの実際のデプロイURLを入力してください（例: https://script.google.com/macros/s/AKfycb.../exec）",
			);
			return;
		}
		setCheckingHealth(true);
		setError(null);
		try {
			const res = await checkHealth(apiUrl);
			setResponse(res);
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			setError(
				`疎通確認エラー (${msg}): GASのデプロイ設定で「アクセスできるユーザー」が「全員 (Anyone)」になっているか確認してください。`,
			);
			setResponse(null);
		} finally {
			setCheckingHealth(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!apiUrl || apiUrl.includes("YOUR_DEPLOYMENT_ID")) {
			setError(
				"GAS Web Appの実際のデプロイURLを入力してください（例: https://script.google.com/macros/s/AKfycb.../exec）",
			);
			return;
		}
		setLoading(true);
		setError(null);
		setResponse(null);

		try {
			const res = await sendContactForm(apiUrl, formData);
			setResponse(res);
			if (res.success) {
				setFormData({
					name: "",
					email: "",
					category: "ご質問・ご相談",
					message: "",
					honeypot: "",
				});
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			setError(`送信エラー: ${msg}`);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 md:p-8 flex items-center justify-center">
			<div className="w-full max-w-xl space-y-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-xl font-bold">
							Contact Form API テスター
						</CardTitle>
						<CardDescription>
							既存サイトからGAS Web API (`doPost` / `doGet`)
							へのリクエスト送受信をテストできます。
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<label className="text-sm font-medium">
								GAS エンドポイント URL
							</label>
							<div className="flex gap-2">
								<Input
									value={apiUrl}
									onChange={(e) => setApiUrl(e.target.value)}
									placeholder="https://script.google.com/macros/s/.../exec"
								/>
								<Button
									variant="outline"
									onClick={handleHealthCheck}
									disabled={checkingHealth || !apiUrl}
								>
									<RefreshCw
										className={`size-4 ${checkingHealth ? "animate-spin" : ""}`}
									/>
									疎通確認
								</Button>
							</div>
						</div>

						<form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t">
							{/* スパム対策用の非表示フィールド */}
							<input
								type="text"
								name="honeypot"
								value={formData.honeypot}
								onChange={(e) =>
									setFormData({ ...formData, honeypot: e.target.value })
								}
								style={{ display: "none" }}
								tabIndex={-1}
								autoComplete="off"
							/>

							<div className="space-y-2">
								<label className="text-sm font-medium">お名前 *</label>
								<Input
									required
									value={formData.name}
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
									placeholder="山田 太郎"
								/>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium">メールアドレス *</label>
								<Input
									required
									type="email"
									value={formData.email}
									onChange={(e) =>
										setFormData({ ...formData, email: e.target.value })
									}
									placeholder="taro@example.com"
								/>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium">お問い合わせ種別</label>
								<select
									className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
									value={formData.category}
									onChange={(e) =>
										setFormData({ ...formData, category: e.target.value })
									}
								>
									<option value="ご質問・ご相談">ご質問・ご相談</option>
									<option value="お見積り・資料請求">お見積り・資料請求</option>
									<option value="その他">その他</option>
								</select>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium">
									お問い合わせ内容 *
								</label>
								<textarea
									required
									rows={4}
									className="w-full rounded-lg border border-input bg-transparent p-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
									value={formData.message}
									onChange={(e) =>
										setFormData({ ...formData, message: e.target.value })
									}
									placeholder="お問い合わせ内容を入力してください..."
								/>
							</div>

							<Button type="submit" className="w-full" disabled={loading}>
								<Send className="size-4 mr-2" />
								{loading ? "送信中..." : "フォームを送信"}
							</Button>
						</form>

						{/* レスポンス表示エリア */}
						{response && (
							<div
								className={`p-4 rounded-lg flex items-start gap-3 text-sm ${
									response.success
										? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
										: "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200"
								}`}
							>
								{response.success ? (
									<CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
								) : (
									<AlertCircle className="size-5 shrink-0 text-red-600" />
								)}
								<div className="space-y-1">
									<div className="font-semibold">
										{response.success ? "成功" : "エラー"}
									</div>
									<div>{response.message}</div>
									<pre className="text-xs bg-black/5 dark:bg-white/5 p-2 rounded mt-2 overflow-x-auto">
										{JSON.stringify(response, null, 2)}
									</pre>
								</div>
							</div>
						)}

						{error && (
							<div className="p-4 rounded-lg bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200 flex items-start gap-3 text-sm">
								<AlertCircle className="size-5 shrink-0 text-red-600" />
								<div>
									<div className="font-semibold">通信エラー</div>
									<div>{error}</div>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
