// User management routes (admin only), plus officer list for assignment.
const express = require('express');
const User = require('../models/User');
const Role = require('../models/Role');
const ActivityLog = require('../models/ActivityLog');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect, authorize('admin'));

// GET /api/users - list all users (optionally filter by role name).
router.get('/', async (req, res, next) => {
  try {
    const { role } = req.query;
    let query = {};
    if (role) {
      const roleDoc = await Role.findOne({ name: role });
      if (roleDoc) query.role = roleDoc._id;
    }
    const users = await User.find(query).populate('role', 'name').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
});

// POST /api/users - admin creates a user with any role (e.g. officers).
router.post('/', async (req, res, next) => {
  try {
    const { name, email, password, role, department } = req.body;
    const roleDoc = await Role.findOne({ name: role || 'student' });
    if (!roleDoc) return res.status(400).json({ success: false, message: 'Invalid role.' });
    const user = await User.create({ name, email, password, department, role: roleDoc._id });
    await ActivityLog.create({ actor: req.user._id, action: 'USER_CREATED', details: `Created ${role} account for ${email}` });
    res.status(201).json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: roleDoc.name } });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/:id - change role or activate/deactivate.
router.put('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const { role, isActive, name, department } = req.body;
    if (role) {
      const roleDoc = await Role.findOne({ name: role });
      if (!roleDoc) return res.status(400).json({ success: false, message: 'Invalid role.' });
      user.role = roleDoc._id;
    }
    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (name) user.name = name;
    if (department !== undefined) user.department = department;
    await user.save();

    await ActivityLog.create({ actor: req.user._id, action: 'USER_UPDATED', details: `Updated account ${user.email}` });
    res.json({ success: true, message: 'User updated.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
