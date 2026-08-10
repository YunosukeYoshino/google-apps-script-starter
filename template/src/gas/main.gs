/**
 * GETリクエストに対するレスポンスを返します。
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile("index")
    .setTitle("GAS Web App")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

/**
 * サーバー時刻を返します。ブラウザから google.script.run で呼び出されます。
 * @return {string} 現在の日時文字列
 */
function getServerTime() {
  return new Date().toLocaleString("ja-JP");
}

/**
 * 名前を受け取り、挨拶メッセージを返します。
 * @param {string} name 名前
 * @return {string} 挨拶メッセージ
 */
function getGreeting(name) {
  const normalizedName = String(name ?? "").trim().slice(0, 80);
  const recipient = normalizedName || "world";

  return `Hello, ${recipient}! ${new Date().toLocaleString("ja-JP")}`;
}