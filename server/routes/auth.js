// Authentication routes: register, login, get current profile.
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/auth');

const router = express.Router();

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
}

// POST /api/auth/register  - create a student/staff account.
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, department } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }
    // New sign-ups are always students/staff. Admins create officer accounts.
    const studentRole = await Role.findOne({ name: 'student' });
    const user = await User.create({ name, email, password, department, role: studentRole._id });

    await ActivityLog.create({ actor: user._id, action: 'USER_REGISTERED', details: `${user.email} created an account` });

    const token = signToken(user._id);
    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: 'student', department: user.department },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password').populate('role', 'name');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Incorrect email or password.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
    }

    await ActivityLog.create({ actor: user._id, action: 'USER_LOGIN', details: `${user.email} logged in` });

    const token = signToken(user._id);
    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role.name, department: user.department },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me - profile of the logged-in user.
router.get('/me', protect, (req, res) => {
  const u = req.user;
  res.json({
    success: true,
    user: { id: u._id, name: u.name, email: u.email, role: u.role.name, department: u.department },
  });
});

module.exports = router;
