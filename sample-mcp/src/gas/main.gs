/**
 * GETリクエストに対するレスポンスを返します。
 */
function doGet() {
	return HtmlService.createHtmlOutputFromFile("index")
		.setTitle("Spreadsheet MCP sample")
		.addMetaTag("viewport", "width=device-width, initial-scale=1");
}
