
module.exports = function requireApprovedUser(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to access this resource."
    });
  }

  next();
};
