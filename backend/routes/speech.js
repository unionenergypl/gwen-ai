
const express = require("express");
const rateLimit = require("express-rate-limit");

const authenticate = require("../middleware/authenticate");
const requireApprovedUser = require("../middleware/requireApprovedUser");
const { transcribePcm } = require("../services/qwenAsr");

const router = express.Router();

const speechLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many speech requests. Please try again later."
});

router.post(
  "/stt",
  authenticate,
  requireApprovedUser,
  speechLimiter,
  express.raw({
    type: "application/octet-stream",
    limit: "2mb"
  }),
  async (req, res) => {
    try {
      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Audio data is required."
        });
      }

      const startedAt = Date.now();
      const result = await transcribePcm(req.body);

      return res.json({
        success: true,
        transcript: result.transcript,
        language: result.language,
        durationMs: Date.now() - startedAt
      });
    } catch (error) {
      console.error("Speech recognition error:", error.message);

      return res.status(502).json({
        success: false,
        message: "Unable to process speech recognition."
      });
    }
  }
);

module.exports = router;
