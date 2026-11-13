const mongoose = require('mongoose');

const ALGORITHMS = [
  'bubble-sort',
  'selection-sort',
  'insertion-sort',
  'merge-sort',
  'quick-sort',
  'heap-sort',
  'counting-sort',
  'radix-sort',
  'binary-search',
  'linear-search',
  'bfs',
  'dfs',
  'dijkstra',
  'prim',
  'kruskal',
  'avl-tree',
  'red-black-tree',
  'b-tree',
  'stack',
  'queue',
  'linked-list',
  'hash-table',
];

const DatasetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Dataset name is required'],
      trim: true,
      maxlength: [100, 'Name must be at most 100 characters'],
    },
    algorithm: {
      type: String,
      required: [true, 'Algorithm is required'],
      enum: {
        values: ALGORITHMS,
        message: 'Invalid algorithm value',
      },
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Dataset data is required'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description must be at most 500 characters'],
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for quick lookup by user
DatasetSchema.index({ userId: 1, createdAt: -1 });
DatasetSchema.index({ isPublic: 1, createdAt: -1 });

module.exports = mongoose.model('Dataset', DatasetSchema);
