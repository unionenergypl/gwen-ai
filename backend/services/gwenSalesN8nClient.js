
const WEBHOOK_URL = process.env.N8N_SALES_WEBHOOK_URL;
const API_KEY = process.env.N8N_SALES_API_KEY;

async function callGwenSalesAgent(payload) {
  if (!WEBHOOK_URL || !API_KEY) {
    throw new Error("Missing Gwen Sales n8n configuration");
  }

  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(60000),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`n8n returned HTTP ${response.status}`);
  }

  let data;

  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error("n8n returned an invalid JSON response");
  }

  if (typeof data.reply !== "string" || !data.reply.trim()) {
    throw new Error("n8n did not return a valid Gwen reply");
  }

  return data;
}

module.exports = { callGwenSalesAgent };
