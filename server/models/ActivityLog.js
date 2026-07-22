// Status Updates / Activity Log entity (advanced feature: audit trail).
// Every important action in the system creates one of these records.
const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    request: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', default: null },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true }, // e.g. REQUEST_CREATED, STATUS_UPDATED
    details: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);
