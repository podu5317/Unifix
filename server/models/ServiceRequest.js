// Service Request entity - the core record of the system.
const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    description: { type: String, required: [true, 'Description is required'] },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    location: { type: String, required: [true, 'Location is required'] },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'in_progress', 'completed', 'rejected'],
      default: 'pending',
    },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    // Uploaded photo of the fault (advanced feature: file upload).
    evidenceImage: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
