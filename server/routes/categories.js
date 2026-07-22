// Category routes - anyone logged in can list; only admins manage.
const express = require('express');
const Category = require('../models/Category');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, async (req, res, next) => {
  try {
    const categories = await Category.find().sort('name');
    res.json({ success: true, categories });
  } catch (err) {
    next(err);
  }
});

router.post('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const category = await Category.create({ name: req.body.name, description: req.body.description });
    res.status(201).json({ success: true, category });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
    res.json({ success: true, message: 'Category deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
