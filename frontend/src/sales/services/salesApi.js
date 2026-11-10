
import { apiFetch } from "../../services/apiClient";

export async function sendSalesMessage({
  message,
  sessionId,
  language = "auto",
}) {
  const response = await apiFetch("/api/gwen/sales/message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      sessionId,
      language,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || `Gwen request failed (${response.status}).`
    );
  }

  return data;
}
