const express = require('express');
const router = express.Router();
const AdminUser = require('../models/AdminUser');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { protect, admin, superAdmin } = require('../middleware/auth');

// @route   POST /api/admin/auth/login
// @desc    Login admin user
// @access  Public
router.post('/auth/login', [
  check('username', 'Username is required').not().isEmpty(),
  check('password', 'Password is required').exists()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    // Check if user exists
    const user = await AdminUser.findOne({ username }).select('+password');
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = user.generateAuthToken();

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/admin/auth/register
// @desc    Register new admin user
// @access  Private (Admin only)
router.post('/auth/register', [protect, superAdmin], [
  check('username', 'Username is required').not().isEmpty(),
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  check('role', 'Role must be valid').isIn(['superadmin', 'admin', 'moderator'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password, role } = req.body;

  try {
    // Check if user already exists
    let user = await AdminUser.findOne({ username });
    if (user) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Create new user
    user = new AdminUser({
      username,
      password,
      role: role || 'admin'
    });

    await user.save();

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all admin users
// @access  Private (Admin only)
router.get('/users', [protect, admin], async (req, res) => {
  try {
    const users = await AdminUser.find().select('-password');
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get single admin user
// @access  Private (Admin only)
router.get('/users/:id', [protect, admin], async (req, res) => {
  try {
    const user = await AdminUser.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update admin user
// @access  Private (Admin only)
router.put('/users/:id', [protect, admin], [
  check('username', 'Username is required').optional().not().isEmpty(),
  check('password', 'Password must be at least 6 characters').optional().isLength({ min: 6 }),
  check('role', 'Role must be valid').optional().isIn(['superadmin', 'admin', 'moderator']),
  check('isActive', 'isActive must be boolean').optional().isBoolean()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username, password, role, isActive } = req.body;
    
    const user = await AdminUser.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields if provided
    if (username) user.username = username;
    if (password) user.password = password; // Will be hashed by pre-save hook
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete admin user
// @access  Private (Admin only)
router.delete('/users/:id', [protect, admin], async (req, res) => {
  try {
    const user = await AdminUser.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.remove();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/admin/auth/logout
// @desc    Logout admin user
// @access  Private
router.post('/auth/logout', protect, (req, res) => {
  // In JWT, logout is typically handled client-side by removing the token
  // Server-side, we can add the token to a blacklist if needed
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// @route   GET /api/admin/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/auth/me', protect, async (req, res) => {
  try {
    const user = await AdminUser.findById(req.user.id).select('-password');
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;