
require("dotenv").config();
const gwenEnquiryRoutes = require("./routes/gwenEnquiry");
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173"
}));

app.use(express.text({
  type: ["application/sdp", "text/plain"],
  limit: "2mb"
}));

app.use(express.json({ limit: "2mb" }));

// NEW: Gwen → n8n enquiry integration
app.use("/api/gwen", gwenEnquiryRoutes);


const rateLimit = require("express-rate-limit");

const realtimeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many connection requests. Please try again later."
});

app.use(
  "/api/realtime/sdp",
  realtimeLimiter
);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Gwen AI backend",
    qwenConfigured: Boolean(
      process.env.QWEN_API_KEY &&
      process.env.QWEN_WORKSPACE_ID
    ),
    model: process.env.QWEN_MODEL || "not configured",
    region: process.env.QWEN_REGION || "not configured"
  });
});

// Exchange the browser's WebRTC offer with Qwen.
// The API key remains on the backend.
app.post("/api/realtime/sdp", async (req, res) => {
  try {
    const {
      QWEN_API_KEY,
      QWEN_WORKSPACE_ID,
      QWEN_REGION = "ap-southeast-1",
      QWEN_MODEL = "qwen3.8-omni-flash-realtime"
    } = process.env;

    if (!QWEN_API_KEY || !QWEN_WORKSPACE_ID) {
      return res.status(500).send("Qwen credentials are not configured.");
    }

    const sdpOffer =
      typeof req.body === "string"
        ? req.body
        : req.body?.sdp;

    if (typeof sdpOffer !== "string" || !sdpOffer.trim()) {
      return res.status(400).send(
        "Missing SDP offer. Expected raw SDP or JSON containing an sdp field."
      );
    }

    const endpoint =
      `https://${QWEN_WORKSPACE_ID}.${QWEN_REGION}.maas.aliyuncs.com` +
      `/api/v1/webrtc/realtime?model=${encodeURIComponent(QWEN_MODEL)}`;

    const qwenResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${QWEN_API_KEY}`,
        "Content-Type": "application/sdp"
      },
      body: sdpOffer
    });

    const answer = await qwenResponse.text();

    if (!qwenResponse.ok) {
      console.error("Qwen error:", qwenResponse.status, answer);
      return res.status(qwenResponse.status).send(answer);
    }

    res.type("application/sdp").send(answer);

  } catch (error) {
    console.error("Backend error:", error);
    res.status(500).send("Unable to connect to Qwen.");
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Gwen AI backend running at http://localhost:${port}`);
});
