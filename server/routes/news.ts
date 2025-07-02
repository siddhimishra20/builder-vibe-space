import { RequestHandler } from "express";

const NEWS_WEBHOOK_URL =
  "https://e0ca-5-195-220-7.ngrok-free.app/webhook-test/0634cba5-334d-434c-aa51-607949086c77";

export const handleNewsProxy: RequestHandler = async (req, res) => {
  try {
    console.log("Proxying news request to:", NEWS_WEBHOOK_URL);

    const response = await fetch(NEWS_WEBHOOK_URL, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
        "User-Agent": "TechRadar-Server/1.0",
      },
    });

    console.log("Webhook response status:", response.status);
    console.log(
      "Webhook response headers:",
      Object.fromEntries(response.headers.entries()),
    );

    if (!response.ok) {
      console.error("Webhook error:", response.status, response.statusText);

      // Get the error response body for debugging
      const errorText = await response.text();
      console.error("Webhook error response:", errorText);

      // Try to parse the error response to provide better feedback
      let parsedError;
      try {
        parsedError = JSON.parse(errorText);
      } catch (e) {
        parsedError = { message: errorText };
      }

      // Check if it's a webhook registration issue
      if (
        response.status === 404 &&
        parsedError.message?.includes("not registered")
      ) {
        return res.status(404).json({
          error: "N8N Webhook Not Active",
          message: "The webhook is in test mode and needs to be activated",
          hint: "Click 'Execute workflow' button in n8n, then refresh this page",
          status: response.status,
          webhookDetails: parsedError,
        });
      }

      return res.status(response.status).json({
        error: "Webhook request failed",
        status: response.status,
        statusText: response.statusText,
        webhookResponse: parsedError,
        webhookUrl: NEWS_WEBHOOK_URL,
      });
    }

    const contentType = response.headers.get("content-type");
    console.log("Response content type:", contentType);

    // Get response as text first to handle potential parsing issues
    const responseText = await response.text();
    console.log("Response text length:", responseText.length);
    console.log("Response preview:", responseText.substring(0, 200));

    if (!responseText || responseText.trim().length === 0) {
      console.warn("Empty response from webhook");
      return res.status(200).json([]);
    }

    // Try to parse as JSON
    let jsonData;
    try {
      jsonData = JSON.parse(responseText);
      console.log("Successfully parsed JSON data");
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Failed response text:", responseText);

      return res.status(500).json({
        error: "Invalid JSON response from webhook",
        details: parseError.message,
        responsePreview: responseText.substring(0, 500),
      });
    }

    // Set CORS headers to allow frontend access
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");

    // Return the parsed JSON data
    res.json(jsonData);
  } catch (error) {
    console.error("Error in news proxy:", error);

    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
};
