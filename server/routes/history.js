const express = require('express');
const { body, validationResult } = require('express-validator');
const SimulationHistory = require('../models/SimulationHistory');
const auth = require('../middleware/auth');

const router = express.Router();

// All history routes require authentication
router.use(auth);

// @route  GET /api/history
// @desc   Get paginated simulation history for the authenticated user
// @access Private
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      SimulationHistory.find({ userId: req.user.id })
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('datasetId', 'name algorithm'),
      SimulationHistory.countDocuments({ userId: req.user.id }),
    ]);

    res.json({
      success: true,
      count: history.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      history,
    });
  } catch (err) {
    next(err);
  }
});

// @route  POST /api/history
// @desc   Log a new simulation run
// @access Private
router.post(
  '/',
  [
    body('algorithm').notEmpty().withMessage('Algorithm is required'),
    body('steps').optional().isNumeric().withMessage('Steps must be a number'),
    body('duration').optional().isNumeric().withMessage('Duration must be a number'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { algorithm, datasetId, inputData, steps, duration } = req.body;

      const entry = await SimulationHistory.create({
        userId: req.user.id,
        algorithm,
        datasetId: datasetId || null,
        inputData,
        steps: steps || 0,
        duration: duration || 0,
      });

      res.status(201).json({ success: true, entry });
    } catch (err) {
      next(err);
    }
  }
);

// @route  DELETE /api/history
// @desc   Clear all simulation history for the authenticated user
// @access Private
// NOTE: Must be defined before /:id to avoid route conflict
router.delete('/', async (req, res, next) => {
  try {
    const result = await SimulationHistory.deleteMany({ userId: req.user.id });
    res.json({
      success: true,
      message: `Cleared ${result.deletedCount} history entries`,
    });
  } catch (err) {
    next(err);
  }
});

// @route  DELETE /api/history/:id
// @desc   Delete a single history entry
// @access Private
router.delete('/:id', async (req, res, next) => {
  try {
    const entry = await SimulationHistory.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, error: 'History entry not found' });
    }

    if (entry.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    await entry.deleteOne();
    res.json({ success: true, message: 'History entry deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
