// ← JWT verification (protects routes)
// middleware/auth.js — Protects routes by verifying JWT tokens
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'studynest-secret-change-in-production';

function authenticate(req, res, next) {
  // Token comes in the Authorization header as "Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user info to the request
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token. Please log in again.' });
  }
}

module.exports = { authenticate, JWT_SECRET };