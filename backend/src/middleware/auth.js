const jwt = require("jsonwebtoken");
const config = require("../config");
const prisma = require("../prisma");

function authenticate(required = true) {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      if (required) {
        return res.status(401).json({ message: "Authentication required" });
      }
      req.user = null;
      return next();
    }

    try {
      const payload = jwt.verify(token, config.jwtSecret);
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user) {
        return res.status(401).json({ message: "Invalid token" });
      }
      req.user = user;
      next();
    } catch (error) {
      console.error("Auth error", error);
      return res.status(401).json({ message: "Invalid token" });
    }
  };
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
