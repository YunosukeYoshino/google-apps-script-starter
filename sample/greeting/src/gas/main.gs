function doGet() {
	return HtmlService.createHtmlOutputFromFile("index")
		.setTitle("Greeting sample")
		.addMetaTag("viewport", "width=device-width, initial-scale=1");
}

function getGreeting(name) {
	const normalizedName = String(name ?? "")
		.trim()
		.slice(0, 80);
	const recipient = normalizedName || "world";

	return `Hello, ${recipient}! ${new Date().toLocaleString("ja-JP")}`;
}
