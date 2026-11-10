
const express = require("express");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");

const { triggerN8n } = require("../services/n8nClient");
const authenticate = require("../middleware/authenticate");
const requireApprovedUser = require("../middleware/requireApprovedUser");

const router = express.Router();

const enquiryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many enquiries. Please try again later."
  }
});

// POST /api/gwen/enquiry
router.post(
  "/enquiry",
  authenticate,
  requireApprovedUser,
  enquiryLimiter,
  async (req, res) => {
    try {
      const { message, sessionId } = req.body || {};

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
          message: "Invalid enquiry information."
        });
      }

      const requestId = crypto.randomUUID();

      // Identity comes from the verified backend user context,
      // never from values supplied by the browser.
      const payload = {
        requestId,
        eventType: "GWEN_ENQUIRY",
        message: message.trim(),
        userId: req.user.id,
        userEmail: req.user.email,
        sessionId: sessionId.trim(),
        timestamp: new Date().toISOString(),
        source: "gwen_frontend"
      };

      console.log(`[Gwen] Enquiry received: ${requestId}`);

      const result = await triggerN8n(payload);

      return res.status(202).json({
        success: true,
        requestId,
        message: "Enquiry successfully delivered to n8n.",
        n8nStatus: result.status
      });

    } catch (error) {
      console.error(
        "[Gwen] n8n enquiry error:",
        error.message
      );

      return res.status(502).json({
        success: false,
        message: "Unable to contact the n8n workflow."
      });
    }
  }
);

module.exports = router;


