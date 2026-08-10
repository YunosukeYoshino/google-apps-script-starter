import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app");
if (app) {
	const message = document.createElement("p");
	message.className = "caption";
	message.textContent = "Ready to develop with Vite + GAS";
	app.append(message);
}
