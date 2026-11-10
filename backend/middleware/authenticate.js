
const jwt = require("jsonwebtoken");

module.exports = function authenticate(req, res, next) {
  const JWT_SECRET = process.env.JWT_SECRET;
  const authHeader = req.headers.authorization || "";

  if (!JWT_SECRET) {
    return res.status(503).json({
      success: false,
      message: "Backend authentication is not configured."
    });
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return res.status(401).json({
      success: false,
      message: "Bearer token required."
    });
  }

  try {
    const decoded = jwt.verify(match[1], JWT_SECRET, {
      issuer: "gwen-ai",
      audience: "gwen-api"
    });

    req.user = {
      id: decoded.sub,
      email: null,
      role: decoded.role
    };

    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token."
    });
  }
};
