// Service Request routes - CRUD, assignment, status updates.
// Advanced features here: search/filter/pagination, file upload, audit trail.
const express = require('express');
const ServiceRequest = require('../models/ServiceRequest');
const Assignment = require('../models/Assignment');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();
router.use(protect); // every route below requires login

// POST /api/requests - create a request (student/staff). Optional image upload.
router.post('/', upload.single('evidenceImage'), async (req, res, next) => {
  try {
    const { title, description, category, location, priority } = req.body;
    const request = await ServiceRequest.create({
      title,
      description,
      category,
      location,
      priority,
      requester: req.user._id,
      evidenceImage: req.file ? `/uploads/${req.file.filename}` : null,
    });
    await ActivityLog.create({
      request: request._id,
      actor: req.user._id,
      action: 'REQUEST_CREATED',
      details: `"${request.title}" submitted`,
    });
    res.status(201).json({ success: true, request });
  } catch (err) {
    next(err);
  }
});

// GET /api/requests - list requests with search, filter and pagination.
// Students see their own; officers see requests assigned to them; admins see all.
router.get('/', async (req, res, next) => {
  try {
    const { status, category, priority, search, page = 1, limit = 10 } = req.query;
    const query = {};

    const roleName = req.user.role.name;
    if (roleName === 'student') query.requester = req.user._id;
    if (roleName === 'officer') query.assignedTo = req.user._id;

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (search) {
      // Case-insensitive keyword search across title, description and location.
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ title: rx }, { description: rx }, { location: rx }];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

    const [requests, total] = await Promise.all([
      ServiceRequest.find(query)
        .populate('category', 'name')
        .populate('requester', 'name email')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      ServiceRequest.countDocuments(query),
    ]);

    res.json({
      success: true,
      requests,
      pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) || 1 },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/requests/stats - dashboard counts (admin only).
router.get('/stats', authorize('admin'), async (req, res, next) => {
  try {
    const byStatus = await ServiceRequest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const stats = { pending: 0, assigned: 0, in_progress: 0, completed: 0, rejected: 0, total: 0 };
    byStatus.forEach((s) => {
      stats[s._id] = s.count;
      stats.total += s.count;
    });
    res.json({ success: true, stats });
  } catch (err) {
    next(err);
  }
});

// GET /api/requests/:id - view one request (with its history).
router.get('/:id', async (req, res, next) => {
  try {
    const request = await ServiceRequest.findById(req.params.id)
      .populate('category', 'name')
      .populate('requester', 'name email department')
      .populate('assignedTo', 'name email');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });

    // Students may only view their own requests.
    const roleName = req.user.role.name;
    if (roleName === 'student' && String(request.requester._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only view your own requests.' });
    }

    const history = await ActivityLog.find({ request: request._id })
      .populate('actor', 'name')
      .sort({ createdAt: 1 });

    res.json({ success: true, request, history });
  } catch (err) {
    next(err);
  }
});

// PUT /api/requests/:id/assign - admin assigns an officer.
router.put('/:id/assign', authorize('admin'), async (req, res, next) => {
  try {
    const { officerId, note } = req.body;
    const officer = await User.findById(officerId).populate('role', 'name');
    if (!officer || officer.role.name !== 'officer') {
      return res.status(400).json({ success: false, message: 'Selected user is not a maintenance officer.' });
    }
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });

    request.assignedTo = officer._id;
    request.status = 'assigned';
    await request.save();

    await Assignment.create({ request: request._id, officer: officer._id, assignedBy: req.user._id, note });
    await ActivityLog.create({
      request: request._id,
      actor: req.user._id,
      action: 'REQUEST_ASSIGNED',
      details: `Assigned to ${officer.name}${note ? ` - ${note}` : ''}`,
    });

    res.json({ success: true, request });
  } catch (err) {
    next(err);
  }
});

// PUT /api/requests/:id/status - officer or admin updates progress.
router.put('/:id/status', authorize('officer', 'admin'), async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const allowed = ['in_progress', 'completed', 'rejected', 'pending', 'assigned'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}` });
    }
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });

    // Officers can only update requests assigned to them.
    if (req.user.role.name === 'officer' && String(request.assignedTo) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'This request is not assigned to you.' });
    }

    request.status = status;
    await request.save();

    await ActivityLog.create({
      request: request._id,
      actor: req.user._id,
      action: 'STATUS_UPDATED',
      details: `Status changed to "${status}"${note ? ` - ${note}` : ''}`,
    });

    res.json({ success: true, request });
  } catch (err) {
    next(err);
  }
});

// PUT /api/requests/:id - requester edits their own pending request.
router.put('/:id', async (req, res, next) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });
    if (String(request.requester) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only edit your own requests.' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending requests can be edited.' });
    }
    const { title, description, category, location, priority } = req.body;
    Object.assign(request, { title, description, category, location, priority });
    await request.save();
    await ActivityLog.create({ request: request._id, actor: req.user._id, action: 'REQUEST_UPDATED', details: 'Request details edited' });
    res.json({ success: true, request });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/requests/:id - requester deletes own pending request; admin any.
router.delete('/:id', async (req, res, next) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });

    const isAdmin = req.user.role.name === 'admin';
    const isOwner = String(request.requester) === String(req.user._id);
    if (!isAdmin && !(isOwner && request.status === 'pending')) {
      return res.status(403).json({ success: false, message: 'You cannot delete this request.' });
    }

    await request.deleteOne();
    await ActivityLog.create({ actor: req.user._id, action: 'REQUEST_DELETED', details: `"${request.title}" deleted` });
    res.json({ success: true, message: 'Request deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
