const mongoose = require('mongoose');

const SimulationHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  algorithm: {
    type: String,
    required: [true, 'Algorithm is required'],
  },
  datasetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dataset',
    default: null,
  },
  inputData: {
    type: mongoose.Schema.Types.Mixed,
  },
  steps: {
    type: Number,
    default: 0,
  },
  duration: {
    type: Number, // milliseconds
    default: 0,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for quick lookup by user, most recent first
SimulationHistorySchema.index({ userId: 1, completedAt: -1 });

module.exports = mongoose.model('SimulationHistory', SimulationHistorySchema);
