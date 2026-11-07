
export async function sendEnquiryToN8n(
  userMessage,
  userId,
  sessionId
) {
  try {
    const response = await fetch("/api/gwen/enquiry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: userMessage,
        userId,
        sessionId
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Unable to send enquiry"
      );
    }

    console.log("Gwen enquiry accepted:", data);

    return data;
  } catch (error) {
    console.error("Gwen enquiry failed:", error);
    throw error;
  }
}
