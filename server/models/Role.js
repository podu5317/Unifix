// Role entity - stores the three system roles.
const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: ['student', 'officer', 'admin'],
    },
    description: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Role', roleSchema);
