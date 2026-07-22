// Authentication + authorization middleware.
// "protect" checks the JWT token. "authorize" checks the user's role (RBAC).
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Advanced feature: JWT-based authentication.
async function protect(req, res, next) {
  try {
    let token = null;
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      token = header.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not logged in. Please log in first.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate('role', 'name');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Account not found or deactivated.' });
    }

    req.user = user; // make the logged-in user available to route handlers
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token. Please log in again.' });
  }
}

// Advanced feature: Role-Based Access Control.
// Usage: router.get('/admin-only', protect, authorize('admin'), handler)
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role.name)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.',
      });
    }
    next();
  };
}

module.exports = { protect, authorize };
