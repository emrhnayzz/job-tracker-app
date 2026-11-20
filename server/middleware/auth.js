const jwt = require("jsonwebtoken");
const env = require("../config/env");

const signToken = (userId) =>
  jwt.sign({ id: userId }, env.jwtSecret, { expiresIn: "7d" });

// Every protected route gets the user id from the verified token, never from
// the request body or query string.
const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "auth_required" });

  try {
    req.userId = jwt.verify(token, env.jwtSecret).id;
    next();
  } catch {
    res.status(401).json({ error: "invalid_token" });
  }
};

module.exports = { signToken, requireAuth };
