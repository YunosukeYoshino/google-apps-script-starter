/**
 * `google.script.run` を Promise ベースで呼び出すための型安全なラッパー。
 *
 * GAS の `google.script.run` はコールバック方式（`withSuccessHandler` /
 * `withFailureHandler`）だが、このモジュールはそれを Promise に変換する。
 *
 * @example
 * ```ts
 * const time = await runFunction<string>("getServerTime");
 * const message = await runFunction<string>("getGreeting", "Codex");
 * ```
 */
export function runFunction<T>(name: string, ...args: unknown[]): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const runner = google.script.run
			.withSuccessHandler((value: unknown) => {
				resolve(value as T);
			})
			.withFailureHandler((error: Error) => {
				reject(error);
			});

		// google.script.run は任意の関数名をメソッドとして呼び出せる。
		const fn = runner[name as keyof typeof runner];
		if (typeof fn !== "function") {
			reject(new Error(`GAS function "${name}" is not defined.`));
			return;
		}
		(fn as (...callArgs: unknown[]) => void).apply(runner, args);
	});
}
