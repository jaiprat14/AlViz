const express = require('express');
const { body, validationResult } = require('express-validator');
const Dataset = require('../models/Dataset');
const auth = require('../middleware/auth');

const router = express.Router();

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  return null;
};

const datasetValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name must be at most 100 characters'),
  body('algorithm').notEmpty().withMessage('Algorithm is required'),
  body('data').notEmpty().withMessage('Data is required'),
];

// @route  GET /api/datasets/public
// @desc   Get all public datasets
// @access Public  (must be defined BEFORE /:id to avoid route conflict)
router.get('/public', async (req, res, next) => {
  try {
    const datasets = await Dataset.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .populate('userId', 'username');
    res.json({ success: true, count: datasets.length, datasets });
  } catch (err) {
    next(err);
  }
});

// All routes below this line are protected
router.use(auth);

// @route  GET /api/datasets
// @desc   Get all datasets for the authenticated user
// @access Private
router.get('/', async (req, res, next) => {
  try {
    const datasets = await Dataset.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, count: datasets.length, datasets });
  } catch (err) {
    next(err);
  }
});

// @route  POST /api/datasets
// @desc   Create a new dataset
// @access Private
router.post('/', datasetValidation, async (req, res, next) => {
  const validationError = handleValidation(req, res);
  if (validationError) return;

  try {
    const { name, algorithm, data, description, isPublic } = req.body;
    const dataset = await Dataset.create({
      userId: req.user.id,
      name,
      algorithm,
      data,
      description,
      isPublic: isPublic || false,
    });
    res.status(201).json({ success: true, dataset });
  } catch (err) {
    next(err);
  }
});

// @route  GET /api/datasets/:id
// @desc   Get a single dataset (owner or public)
// @access Private (but public datasets accessible to any authenticated user)
router.get('/:id', async (req, res, next) => {
  try {
    const dataset = await Dataset.findById(req.params.id).populate('userId', 'username');
    if (!dataset) {
      return res.status(404).json({ success: false, error: 'Dataset not found' });
    }

    const isOwner = dataset.userId._id.toString() === req.user.id;
    if (!isOwner && !dataset.isPublic) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({ success: true, dataset });
  } catch (err) {
    next(err);
  }
});

// @route  PUT /api/datasets/:id
// @desc   Update a dataset (owner only)
// @access Private
router.put('/:id', datasetValidation, async (req, res, next) => {
  const validationError = handleValidation(req, res);
  if (validationError) return;

  try {
    let dataset = await Dataset.findById(req.params.id);
    if (!dataset) {
      return res.status(404).json({ success: false, error: 'Dataset not found' });
    }

    if (dataset.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const { name, algorithm, data, description, isPublic } = req.body;
    dataset = await Dataset.findByIdAndUpdate(
      req.params.id,
      { name, algorithm, data, description, isPublic },
      { new: true, runValidators: true }
    );

    res.json({ success: true, dataset });
  } catch (err) {
    next(err);
  }
});

// @route  DELETE /api/datasets/:id
// @desc   Delete a dataset (owner only)
// @access Private
router.delete('/:id', async (req, res, next) => {
  try {
    const dataset = await Dataset.findById(req.params.id);
    if (!dataset) {
      return res.status(404).json({ success: false, error: 'Dataset not found' });
    }

    if (dataset.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    await dataset.deleteOne();
    res.json({ success: true, message: 'Dataset deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
