// backend/middleware/auth.js
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  try {
    // Expect header: Authorization: Bearer <token>
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No authorization header provided" });
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ error: "Malformed authorization header" });
    }

    const token = parts[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to req
    req.user = {
      id: decoded.id,
      role: decoded.role,   // important for admin routes
      email: decoded.email  // optional
    };

    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};
