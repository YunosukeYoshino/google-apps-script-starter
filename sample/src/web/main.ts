import "./style.css";

const form = document.querySelector<HTMLFormElement>("#greeting-form");
const nameInput = document.querySelector<HTMLInputElement>("#name");
const output = document.querySelector<HTMLOutputElement>("#result");

form?.addEventListener("submit", (event) => {
	event.preventDefault();

	if (!nameInput || !output) {
		return;
	}

	output.textContent = "GASを呼び出しています…";

	google.script.run
		.withSuccessHandler((message: string) => {
			output.textContent = message;
		})
		.withFailureHandler((error: Error) => {
			output.textContent = `エラー: ${error.message}`;
		})
		.getGreeting(nameInput.value);
});
