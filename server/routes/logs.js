// Activity log routes (admin only) - the audit trail viewer.
const express = require('express');
const ActivityLog = require('../models/ActivityLog');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const [logs, total] = await Promise.all([
      ActivityLog.find()
        .populate('actor', 'name email')
        .populate('request', 'title')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      ActivityLog.countDocuments(),
    ]);

    res.json({ success: true, logs, pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) || 1 } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
