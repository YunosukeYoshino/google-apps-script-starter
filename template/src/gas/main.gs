/**
 * GETリクエストに対するレスポンスを返します。
 * (Updated to force push)
 */
function doGet() {
  const template = HtmlService.createTemplateFromFile("index");
  template.serverTime = new Date().toLocaleString("ja-JP");
  
  return template
    .evaluate()
    .setTitle("GAS Web App")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}
