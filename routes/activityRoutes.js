const express = require('express');
const publicRouter = express.Router();
const adminRouter = express.Router();
const Activity = require('../models/Activity');
const { protect: auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const uploadPath = process.env.UPLOAD_PATH || 'uploads';
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const fullUploadPath = path.join(__dirname, '../', uploadPath);
    if (!fs.existsSync(fullUploadPath)) {
      fs.mkdirSync(fullUploadPath, { recursive: true });
    }
    cb(null, fullUploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const prefix = file.mimetype.startsWith('image/') ? 'activity-image' : 'activity-video';
    cb(null, prefix + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'), false);
    }
  }
});

// Get all activities (Public)
publicRouter.get('/', async (req, res) => {
  try {
    const activities = await Activity.getAll();
    res.json({ success: true, activities });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Get activities by date range (Public)
publicRouter.get('/range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const activities = await Activity.getByDateRange(start, end);
    res.json({ success: true, activities });
  } catch (error) {
    console.error('Get activities by range error:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Search activities (Public)
publicRouter.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const activities = await Activity.search(query);
    res.json({ success: true, activities });
  } catch (error) {
    console.error('Search activities error:', error);
    res.status(500).json({ error: 'Failed to search activities' });
  }
});

// Admin-only routes - these will be mounted at /api/admin/activities
adminRouter.get('/', auth, async (req, res) => {
  try {
    const activities = await Activity.getAll();
    res.json({ success: true, activities });
  } catch (error) {
    console.error('Get admin activities error:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Create activity with file upload (Admin only)
adminRouter.post('/', auth, upload.single('mediaFile'), async (req, res) => {
  try {
    const { title, description, mediaType, date } = req.body;
    
    // If file was uploaded, use its path
    let mediaUrl = req.file ? `/${uploadPath}/${req.file.filename}` : '';
    
    // If no file uploaded but mediaUrl provided in body, use that
    if (!req.file && req.body.mediaUrl) {
      mediaUrl = req.body.mediaUrl;
    }
    
    // If no mediaUrl at all, use a default image
    if (!mediaUrl) {
      mediaUrl = 'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=800&h=600&fit=crop';
    }
    
    const activity = new Activity({
      title,
      description,
      mediaType: mediaType || 'image',
      mediaUrl,
      date: new Date(date)
    });
    
    await activity.save();
    res.status(201).json({ success: true, activity });
  } catch (error) {
    console.error('Create activity error:', error);
    
    // Handle multer errors
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
      }
      return res.status(400).json({ error: error.message });
    }
    
    res.status(400).json({ error: error.message });
  }
});

// Update activity (Admin only)
adminRouter.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, mediaType, mediaUrl, date } = req.body;

    const activity = await Activity.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        mediaType,
        mediaUrl,
        date: date ? new Date(date) : undefined
      },
      { new: true }
    );

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json({ success: true, activity });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete activity (Admin only)
adminRouter.delete('/:id', auth, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // Delete associated media file if it exists in uploads
    if (activity.mediaUrl && activity.mediaUrl.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '../', activity.mediaUrl.substring(1));
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }

    await Activity.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Activity deleted' });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = { publicRouter, adminRouter };