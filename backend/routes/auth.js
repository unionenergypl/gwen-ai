
const express = require("express");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authenticate = require("../middleware/authenticate");
const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later."
  }
});

// POST /api/auth/login
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body || {};

    const {
      GWEN_ADMIN_USERNAME,
      GWEN_ADMIN_PASSWORD_HASH,
      JWT_SECRET
    } = process.env;

    if (!GWEN_ADMIN_USERNAME || !GWEN_ADMIN_PASSWORD_HASH || !JWT_SECRET) {
      return res.status(503).json({
        success: false,
        message: "Authentication is not configured."
      });
    }

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      username !== GWEN_ADMIN_USERNAME
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password."
      });
    }

    const passwordValid = await bcrypt.compare(
      password,
      GWEN_ADMIN_PASSWORD_HASH
    );

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password."
      });
    }

    const token = jwt.sign(
      {
        role: "admin"
      },
      JWT_SECRET,
      {
        subject: "gwen-admin",
        issuer: "gwen-ai",
        audience: "gwen-api",
        expiresIn: "1h"
      }
    );

    return res.json({
      success: true,
      token,
      tokenType: "Bearer",
      expiresIn: 3600,
      user: {
        username: GWEN_ADMIN_USERNAME,
        role: "admin"
      }
    });

  } catch (error) {
    console.error("[Auth] Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to process login."
    });
  }
});

// GET /api/auth/me
// Confirms that the supplied JWT is valid.
router.get("/me", authenticate, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      role: req.user.role
    }
  });
});

module.exports = router;
