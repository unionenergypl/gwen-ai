
const express = require("express");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");

const authenticate = require("../middleware/authenticate");
const requireApprovedUser = require("../middleware/requireApprovedUser");
const { callGwenSalesAgent } = require("../services/gwenSalesN8nClient");

const router = express.Router();

const salesLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  "/sales/message",
  authenticate,
  requireApprovedUser,
  salesLimiter,
  async (req, res) => {
    try {
      const { message, sessionId, language = "auto" } = req.body || {};

      if (
        typeof message !== "string" ||
        !message.trim() ||
        message.length > 5000 ||
        typeof sessionId !== "string" ||
        !sessionId.trim() ||
        sessionId.length > 128
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid message or session information.",
        });
      }

      const allowedLanguages = ["auto", "en", "zh", "yue", "nan"];

      if (!allowedLanguages.includes(language)) {
        return res.status(400).json({
          success: false,
          message: "Unsupported language.",
        });
      }

      const requestId = crypto.randomUUID();

      const result = await callGwenSalesAgent({
        requestId,
        eventType: "GWEN_SALES_MESSAGE",
        message: message.trim(),
        userId: req.user.id,
        userEmail: req.user.email,
        sessionId: sessionId.trim(),
        language,
        timestamp: new Date().toISOString(),
        source: "gwen_sales_ui",
      });

      return res.json({
        success: true,
        requestId,
        sessionId,
        reply: result.reply,
      });

    } catch (error) {
      console.error("[Gwen Sales] Error:", error.message);

      return res.status(502).json({
        success: false,
        message: "Gwen Sales is temporarily unable to respond.",
      });
    }
  }
);

module.exports = router;
