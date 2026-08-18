import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

import {
	type ContactFormData,
	checkHealth,
	sendContactForm,
} from "../sample/contact-api/src/web/client";

describe("Contact API Client", () => {
	const originalFetch = globalThis.fetch;
	const mockFetch = mock();

	beforeEach(() => {
		globalThis.fetch = mockFetch as unknown as typeof fetch;
		mockFetch.mockClear();
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	test("sendContactForm sends POST with text/plain Content-Type to avoid CORS preflight", async () => {
		mockFetch.mockResolvedValueOnce(
			new Response(
				JSON.stringify({
					success: true,
					message: "お問い合わせを受け付けました。",
				}),
				{ status: 200, headers: { "Content-Type": "application/json" } },
			),
		);

		const formData: ContactFormData = {
			name: "山田 太郎",
			email: "taro@example.com",
			category: "お見積り",
			message: "料金について",
			honeypot: "",
		};

		const result = await sendContactForm(
			"https://script.google.com/macros/s/TEST/exec",
			formData,
		);

		expect(result.success).toBe(true);
		expect(result.message).toContain("受け付けました");

		expect(mockFetch).toHaveBeenCalledTimes(1);
		const [url, options] = mockFetch.mock.calls[0];
		expect(url).toBe("https://script.google.com/macros/s/TEST/exec");
		expect(options.method).toBe("POST");
		expect(options.headers["Content-Type"]).toBe("text/plain;charset=utf-8");
		expect(JSON.parse(options.body)).toEqual(formData);
	});

	test("sendContactForm throws error on non-ok response", async () => {
		mockFetch.mockResolvedValueOnce(
			new Response("Internal Server Error", { status: 500 }),
		);

		const formData: ContactFormData = {
			name: "山田 太郎",
			email: "taro@example.com",
			message: "料金について",
		};

		expect(
			sendContactForm("https://script.google.com/macros/s/TEST/exec", formData),
		).rejects.toThrow("HTTP error: 500");
	});

	test("checkHealth sends GET request and returns health status", async () => {
		mockFetch.mockResolvedValueOnce(
			new Response(
				JSON.stringify({
					success: true,
					status: "ok",
					version: "1.0.0",
				}),
				{ status: 200, headers: { "Content-Type": "application/json" } },
			),
		);

		const health = await checkHealth(
			"https://script.google.com/macros/s/TEST/exec",
		);

		expect(health.success).toBe(true);
		expect(health.version).toBe("1.0.0");
		expect(mockFetch).toHaveBeenCalledTimes(1);
		const [url, options] = mockFetch.mock.calls[0];
		expect(url).toBe("https://script.google.com/macros/s/TEST/exec");
		expect(options.method).toBe("GET");
	});
});
