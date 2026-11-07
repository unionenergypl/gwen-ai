
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const N8N_WEBHOOK_API_KEY = process.env.N8N_WEBHOOK_API_KEY;

const N8N_TIMEOUT_MS = 10000;

async function triggerN8n(payload) {
  if (!N8N_WEBHOOK_URL || !N8N_WEBHOOK_API_KEY) {
    throw new Error("Missing n8n configuration");
  }

  let response;

  try {
    response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Gwen-Webhook-Key": N8N_WEBHOOK_API_KEY
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(N8N_TIMEOUT_MS)
    });

    // Consume the body without exposing its contents.
    await response.text();

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




//   if (!N8N_WEBHOOK_URL || !N8N_WEBHOOK_API_KEY) {
//     throw new Error("Missing n8n configuration");
//   }

//   const response = await fetch(N8N_WEBHOOK_URL, {
//     method: "POST",

//     headers: {
//       "Content-Type": "application/json",
//       "X-Gwen-Webhook-Key": N8N_WEBHOOK_API_KEY
//     },

//     body: JSON.stringify(payload),

//     signal: AbortSignal.timeout(10000)
//   });

//   const responseBody = await response.text();

//   if (!response.ok) {
//     throw new Error(
//       `n8n HTTP ${response.status}: ${responseBody}`
//     );
//   }

//   return {
//     success: true,
//     status: response.status,
//     response: responseBody
//   };
// }

// module.exports = {
//   triggerN8n
// };
