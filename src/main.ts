import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app");
if (app) {
	const message = document.createElement("p");
	message.className = "mt-4 text-sm text-gray-500 font-mono";
	message.textContent = "Ready to develop with Vite + GAS";
	app.append(message);
}
