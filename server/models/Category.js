// Request Category entity - e.g. Electrical, Plumbing, Furniture...
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
