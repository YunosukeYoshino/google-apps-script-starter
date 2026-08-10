/**
 * `google.script.run` の型定義。
 *
 * GAS の `HtmlService` はブラウザに `google.script.run` を注入する。
 * サーバー側（`src/gas/main.gs`）で公開された関数を呼び出せる。
 * ここでは呼び出し関数を個別に宣言し、`google.script.run` の型を付与する。
 */
type ScriptRunner = {
	withSuccessHandler(handler: (value: unknown) => void): ScriptRunner;
	withFailureHandler(handler: (error: Error) => void): ScriptRunner;
	withUserObject(object: unknown): ScriptRunner;
};

declare const google: {
	script: {
		run: ScriptRunner;
	};
};
