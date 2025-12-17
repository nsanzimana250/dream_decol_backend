const express = require('express');
const router = express.Router();
const ContactMessage = require('../models/ContactMessage');
const { protect, admin } = require('../middleware/auth');
const { check, validationResult } = require('express-validator');

// @route   POST /api/contact
// @desc    Submit new contact message
// @access  Public
router.post('/', [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('message', 'Message must be at least 10 characters').isLength({ min: 10 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, phone, message, productRef } = req.body;

  try {
    const contactMessage = new ContactMessage({
      name,
      email,
      phone,
      message,
      productRef
    });

    await contactMessage.save();

    res.status(201).json({
      success: true,
      message: 'Contact message submitted successfully',
      contactMessage
    });
  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/admin/contact
// @desc    Get all contact messages
// @access  Private (Admin only)
router.get('/admin', [protect, admin], async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: messages.length,
      messages
    });
  } catch (error) {
    console.error('Get contact messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/admin/contact/:id
// @desc    Get single contact message
// @access  Private (Admin only)
router.get('/admin/:id', [protect, admin], async (req, res) => {
  try {
    const message = await ContactMessage.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ error: 'Contact message not found' });
    }

    res.json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Get contact message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/admin/contact/:id/read
// @desc    Mark contact message as read
// @access  Private (Admin only)
router.put('/admin/:id/read', [protect, admin], async (req, res) => {
  try {
    const message = await ContactMessage.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ error: 'Contact message not found' });
    }

    message.read = true;
    await message.save();

    res.json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/admin/contact/:id/unread
// @desc    Mark contact message as unread
// @access  Private (Admin only)
router.put('/admin/:id/unread', [protect, admin], async (req, res) => {
  try {
    const message = await ContactMessage.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ error: 'Contact message not found' });
    }

    message.read = false;
    await message.save();

    res.json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Mark as unread error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/admin/contact/:id
// @desc    Delete contact message
// @access  Private (Admin only)
router.delete('/admin/:id', [protect, admin], async (req, res) => {
  try {
    const message = await ContactMessage.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ error: 'Contact message not found' });
    }

    await message.deleteOne();

    res.json({
      success: true,
      message: 'Contact message deleted successfully'
    });
  } catch (error) {
    console.error('Delete contact message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;