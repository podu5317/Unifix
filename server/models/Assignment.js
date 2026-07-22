// Assignment entity - records which officer was assigned to which request, by whom.
const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    request: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', required: true },
    officer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
