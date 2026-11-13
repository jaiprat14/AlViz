const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Helper to generate JWT
const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// Helper to handle validation errors
const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  return null;
};

// @route  POST /api/auth/register
// @desc   Register a new user
// @access Public
router.post(
  '/register',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be 3-30 characters'),
    body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  async (req, res, next) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const { username, email, password } = req.body;

      // Check uniqueness
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error:
            existingUser.email === email
              ? 'Email is already registered'
              : 'Username is already taken',
        });
      }

      const user = await User.create({ username, email, password });
      const token = signToken(user._id);

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// @route  POST /api/auth/login
// @desc   Login user & return JWT
// @access Public
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res, next) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const { email, password } = req.body;

      // Find user and explicitly select password
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      // Update lastLogin
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      const token = signToken(user._id);

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// @route  GET /api/auth/me
// @desc   Get current authenticated user
// @access Private
router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
});

// @route  POST /api/auth/logout
// @desc   Logout (stateless — just confirm on server side)
// @access Private
router.post('/logout', auth, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
