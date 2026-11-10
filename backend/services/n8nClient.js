
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;

const N8N_TIMEOUT_MS = 10000;

async function triggerN8n(payload) {
  if (!N8N_WEBHOOK_URL || !N8N_API_KEY) {
    throw new Error("Missing n8n configuration");
  }

  let response;

  try {
    response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${N8N_API_KEY}`
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(N8N_TIMEOUT_MS)
    });

    const responseBody = await response.text();

      if (!response.ok) {
        console.error(
          "[n8n] HTTP status:",
          response.status,
          "Response:",
          responseBody.slice(0, 500)
        );
      }

  } catch (error) {
    if (
      error.name === "TimeoutError" ||
      error.name === "AbortError"
    ) {
      throw new Error("n8n request timed out");
    }

    throw new Error("Unable to reach n8n");
  }

  if (!response.ok) {
    throw new Error(`n8n returned HTTP ${response.status}`);
  }

  return {
    success: true,
    status: response.status
  };
}

module.exports = { triggerN8n };
