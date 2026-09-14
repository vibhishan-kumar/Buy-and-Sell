const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'uoh_marketplace_jwt_secret_campus_2026';

async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired authentication token.' });
    }

    const userRes = await db.query(
      'SELECT id, name, email, department, phone, profile_image, role, is_banned FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'User account not found.' });
    }

    const user = userRes.rows[0];

    // Check if user is banned
    if (user.is_banned) {
      return res.status(403).json({
        error: 'Your student account has been suspended by campus administration. Please contact UoH Marketplace admin.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Internal server error during authentication.' });
  }
}

function authorizeRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden: You do not have permission to access this administrative resource.'
      });
    }
    next();
  };
}

async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const userRes = await db.query(
        'SELECT id, name, email, department, phone, profile_image, role, is_banned FROM users WHERE id = $1',
        [decoded.id]
      );
      if (userRes.rows.length > 0 && !userRes.rows[0].is_banned) {
        req.user = userRes.rows[0];
      }
    }
  } catch (err) {
    // Ignore invalid token for optional auth
  }
  next();
}

module.exports = {
  JWT_SECRET,
  authenticateUser,
  authorizeRole,
  optionalAuth
};
