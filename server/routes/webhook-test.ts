import { RequestHandler } from "express";

const NEWS_WEBHOOK_URL =
  "https://e0ca-5-195-220-7.ngrok-free.app/webhook-test/0634cba5-334d-434c-aa51-607949086c77";

export const handleWebhookTest: RequestHandler = async (req, res) => {
  try {
    console.log("Testing webhook connection to:", NEWS_WEBHOOK_URL);
    console.log("Request headers that will be sent:");

    const testHeaders = {
      Accept: "application/json",
      "ngrok-skip-browser-warning": "true",
      "User-Agent": "TechRadar-Test/1.0",
    };

    console.log(testHeaders);

    const response = await fetch(NEWS_WEBHOOK_URL, {
      method: "GET",
      headers: testHeaders,
    });

    console.log("Test response status:", response.status);
    console.log(
      "Test response headers:",
      Object.fromEntries(response.headers.entries()),
    );

    const responseText = await response.text();
    console.log("Test response body:", responseText);

    // Return test results
    res.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseText,
      bodyLength: responseText.length,
      isJson: response.headers
        .get("content-type")
        ?.includes("application/json"),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Webhook test error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
};
