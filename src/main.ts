import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app");
if (app) {
	app.innerHTML = `
    <p class="mt-4 text-sm text-gray-500 font-mono">
      Ready to develop with Vite + GAS
    </p>
  `;
}
